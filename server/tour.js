// 한국관광공사 TourAPI (국문 관광정보 서비스 KorService2)
// 키워드 검색(searchKeyword2) 또는 좌표 주변 검색(locationBasedList2)
const BASE = 'https://apis.data.go.kr/B551011/KorService2'

export async function searchTour({ keyword = '', contentTypeId = '', lat, lng, radius = 8000, rows = 10 } = {}) {
  if (!process.env.DATA_GO_KR_KEY) throw new Error('DATA_GO_KR_KEY 가 설정되지 않았어요 (.env.local)')
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, // ★ Decoding 키
    MobileOS: 'ETC',
    MobileApp: 'ShindeulJeju',
    _type: 'json',
    numOfRows: String(rows),
    pageNo: '1',
  })
  if (contentTypeId) params.set('contentTypeId', String(contentTypeId))

  let op
  if (lat && lng) {
    op = 'locationBasedList2'
    params.set('mapX', String(lng))
    params.set('mapY', String(lat))
    params.set('radius', String(radius))
  } else {
    op = 'searchKeyword2'
    params.set('areaCode', '39') // 39 = 제주
    params.set('keyword', keyword || '제주')
  }

  const text = await (await fetch(`${BASE}/${op}?${params}`)).text()
  let data
  try { data = JSON.parse(text) }
  catch { throw new Error('TourAPI 응답이 JSON이 아님(키 승인 전이거나 Encoding 키): ' + text.slice(0, 100)) }

  const item = data?.response?.body?.items?.item
  const list = !item ? [] : Array.isArray(item) ? item : [item]
  return list.map((p) => ({
    id: p.contentid, title: p.title, addr: p.addr1, image: p.firstimage,
    lng: Number(p.mapx), lat: Number(p.mapy), type: p.contenttypeid,
    dist: p.dist ? Math.round(Number(p.dist)) : undefined,
  }))
}
