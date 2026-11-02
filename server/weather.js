// 기상청 단기예보 조회서비스 (VilageFcstInfoService_2.0)
// 신화 장소마다 위도·경도를 기상청 격자(nx, ny)로 바꿔서 그 자리의 예보를 가져온다.
const BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
const SKY = { 1: '맑음', 3: '구름많음', 4: '흐림' }
const PTY = { 0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기' }

// 위경도 → 기상청 격자 (Lambert Conformal Conic, 기상청 공개 변환식)
export function toGrid(lat, lng) {
  const D = Math.PI / 180
  const RE = 6371.00877 / 5.0
  const slat1 = 30 * D, slat2 = 60 * D, olon = 126 * D, olat = 38 * D
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5)
  ro = (RE * sf) / Math.pow(ro, sn)
  let ra = Math.tan(Math.PI * 0.25 + lat * D * 0.5)
  ra = (RE * sf) / Math.pow(ra, sn)
  let theta = lng * D - olon
  if (theta > Math.PI) theta -= 2 * Math.PI
  if (theta < -Math.PI) theta += 2 * Math.PI
  theta *= sn
  return { nx: Math.floor(ra * Math.sin(theta) + 43 + 0.5), ny: Math.floor(ro - ra * Math.cos(theta) + 136 + 0.5) }
}

// 발표시각: 02·05·08·11·14·17·20·23시 (발표 후 약 10분 뒤부터 조회 가능)
function baseDateTime() {
  const kst = new Date(Date.now() + 9 * 3600e3 - 15 * 60e3)
  let h = [23, 20, 17, 14, 11, 8, 5, 2].find((x) => x <= kst.getUTCHours())
  let day = kst
  if (h === undefined) { day = new Date(kst.getTime() - 24 * 3600e3); h = 23 }
  return {
    base_date: day.toISOString().slice(0, 10).replaceAll('-', ''),
    base_time: String(h).padStart(2, '0') + '00',
  }
}

export async function getWeather({ lat = 33.4996, lng = 126.5312 } = {}) {
  if (!process.env.DATA_GO_KR_KEY) throw new Error('DATA_GO_KR_KEY 가 설정되지 않았어요 (.env.local)')
  const { nx, ny } = toGrid(Number(lat), Number(lng))
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY,
    dataType: 'JSON', numOfRows: '300', pageNo: '1',
    nx: String(nx), ny: String(ny), ...baseDateTime(),
  })
  const text = await (await fetch(`${BASE}?${params}`)).text()
  let data
  try { data = JSON.parse(text) }
  catch { throw new Error('기상청 응답이 JSON이 아님(키 승인 전이거나 Encoding 키): ' + text.slice(0, 100)) }

  const slots = {} // "날짜 시간" → { TMP, SKY, PTY, POP, WSD }
  for (const it of data?.response?.body?.items?.item ?? []) {
    ;(slots[`${it.fcstDate} ${it.fcstTime}`] ??= {})[it.category] = it.fcstValue
  }
  return Object.entries(slots).slice(0, 6).map(([time, v]) => ({
    time, temp: Number(v.TMP), sky: SKY[v.SKY] ?? v.SKY, rain: PTY[v.PTY] ?? v.PTY,
    pop: Number(v.POP), wind: Number(v.WSD), // wind = 풍속(m/s)
  }))
}
