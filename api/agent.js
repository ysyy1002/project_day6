import Anthropic from '@anthropic-ai/sdk'
import { searchTour } from '../server/tour.js'
import { getWeather } from '../server/weather.js'
import { searchHeritage } from '../server/heritage.js'
import { MYTHS } from '../src/data/myths.js'

const MODEL = 'claude-sonnet-5-5'

// 신화 데이터(우리가 가진 로컬 지식)도 하나의 "도구"로 노출한다
function getMythLore({ query = '' } = {}) {
  const q = query.trim()
  const hit = MYTHS.filter((m) => !q || [m.id, m.name, m.deity, m.element, m.story].some((s) => s.includes(q)))
  return hit.map(({ id, name, deity, element, story, lat, lng }) => ({ id, name, deity, element, story, lat, lng }))
}

// ① 도구 설명서: Claude는 이 설명만 보고 "어떤 도구를 언제 쓸지" 결정한다
const tools = [
  {
    name: 'get_myth_lore',
    description: '제주 신화·설화 장소 9곳(삼성혈, 백록담, 영실, 산방산, 용두암, 만장굴, 송당 본향당, 성산일출봉, 귀덕 복덕개)의 신, 줄거리, 좌표를 조회한다. 신 이름·장소·주제어로 검색하고 빈 값이면 전체를 돌려준다.',
    input_schema: { type: 'object', properties: { query: { type: 'string', description: '예: 설문대할망, 바람, 뱀, 산방산' } } },
  },
  {
    name: 'get_weather',
    description: '기상청 단기예보로 특정 좌표의 앞으로 몇 시간 기온·하늘·강수확률·풍속을 조회한다. 신화 장소의 lat/lng 를 넘긴다.',
    input_schema: {
      type: 'object',
      properties: { lat: { type: 'number' }, lng: { type: 'number' } },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'search_tour_places',
    description: '한국관광공사 TourAPI로 제주의 관광지·문화시설·축제·음식점을 검색한다. lat/lng 를 주면 그 좌표 주변(기본 8km), keyword 만 주면 키워드 검색.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string' },
        lat: { type: 'number' }, lng: { type: 'number' },
        contentTypeId: { type: 'string', description: '12 관광지, 14 문화시설, 15 축제·행사, 39 음식점' },
      },
    },
  },
  {
    name: 'search_heritage',
    description: '국가유산청 API로 제주의 국가유산(문화재)을 이름으로 검색한다.',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } } },
  },
]

// ② 도구 이름 → 실제 실행할 함수
const runTool = {
  get_myth_lore: getMythLore,
  get_weather: getWeather,
  search_tour_places: searchTour,
  search_heritage: searchHeritage,
}

const SYSTEM = `너는 제주 신화·설화 안내자 '할망'이다. 말투는 따뜻하고 이야기꾼답되 간결하게.
- 신화 장소·신·줄거리는 get_myth_lore, 날씨는 get_weather, 주변 명소는 search_tour_places, 국가유산은 search_heritage 로 확인한 뒤 답한다.
- 도구 결과에 없는 장소·사실은 지어내지 않는다. 신화는 이본이 많다고 필요하면 덧붙인다.
- 검색 결과가 없으면 "결과가 없다"고 짧게 답한다. 이번 대화에서 도구로 확인하지 않은 신화 줄거리·거리·시간은 기억으로 덧붙이지 말고, 필요하면 get_myth_lore 로 확인한 뒤에만 말한다.
- 신화 장소의 날씨를 볼 땐 좌표를 get_myth_lore 로 먼저 얻어 쓴다. '제주시'·'서귀포시'처럼 도시 이름으로 물으면 그 도시 중심 좌표(제주시 33.4996,126.5312 / 서귀포시 33.2541,126.5601)로 get_weather 를 한 번만 부른다.
- 비·강풍이면 실내 대안을 제안한다.
- 답은 한국어 6문장 이내, 마크다운 기호(**, #, - 목록)는 쓰지 않고 평범한 문장으로 쓴다.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 가 설정되지 않았어요 (.env.local)' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { message, history = [] } = req.body ?? {}
  const messages = [...history.slice(-10), { role: 'user', content: message }] // 최근 10개만 보내 비용 절약
  const steps = []      // 화면에 "호출한 도구"를 보여주기 위한 기록
  const focus = new Set() // 3D 지도에서 반짝일 신화 장소 id

  try {
    // ③ 에이전트 루프: 생각 → 도구 호출 → 결과 확인 → (반복) → 최종 답
    for (let turn = 0; turn < 6; turn++) {
      const r = await client.messages.create({ model: MODEL, max_tokens: 1024, system: SYSTEM, tools, messages })

      if (r.stop_reason !== 'tool_use') {
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
        return res.status(200).json({ answer, steps, focus: [...focus] })
      }

      messages.push({ role: 'assistant', content: r.content })
      const results = []
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue
        let result
        try { result = await runTool[block.name](block.input ?? {}) }
        catch (e) { result = { error: e.message } }
        if (block.name === 'get_myth_lore' && Array.isArray(result)) result.forEach((m) => focus.add(m.id))
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 0, error: result?.error })
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      }
      messages.push({ role: 'user', content: results })
    }
    res.status(200).json({ answer: '도구를 너무 많이 불러서 멈췄어요. 질문을 조금 좁혀 주세요.', steps, focus: [...focus] })
  } catch (e) {
    res.status(e.status ?? 500).json({ error: e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.' : e.message })
  }
}
