// React 화면이 우리 서버 함수(/api/...)를 부를 때 쓰는 함수 모음
// 공공데이터 API를 브라우저에서 직접 부르지 않는다 (키 노출 + CORS) → 반드시 /api 를 거친다.

async function readJson(r) {
  let data
  try { data = await r.json() }
  catch { throw new Error(`서버 응답이 JSON이 아님 (${r.status})`) }
  if (!r.ok) throw new Error(data.error || r.statusText)
  return data
}

const get = async (path) => readJson(await fetch(path))
const post = async (path, body) =>
  readJson(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))

export const ping = () => get('/api/hello')

// 공공데이터 API 3종
export const fetchPlaces = ({ keyword = '', type = '', lat, lng, radius } = {}) => {
  const q = new URLSearchParams({ keyword, type })
  if (lat && lng) { q.set('lat', lat); q.set('lng', lng); if (radius) q.set('radius', radius) }
  return get(`/api/tour?${q}`)
}
export const fetchWeather = ({ lat, lng }) => get(`/api/weather?lat=${lat}&lng=${lng}`)
export const fetchHeritage = (keyword = '') => get(`/api/heritage?keyword=${encodeURIComponent(keyword)}`)

// 에이전트
export const askAgent = (message, history) => post('/api/agent', { message, history })
