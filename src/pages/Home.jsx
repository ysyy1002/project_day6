import { Suspense, lazy, useMemo } from 'react'
import { Badge } from 'react-bootstrap'
import { MYTHS } from '../data/myths'
import { useAppStore } from '../store/useAppStore'
import SitePanel from '../components/SitePanel'

const Scene = lazy(() => import('../components/Scene')) // three.js 는 무거우니 필요할 때 불러온다

export default function Home() {
  const selectedId = useAppStore((s) => s.selectedId)
  const select = useAppStore((s) => s.select)
  const discovered = useAppStore((s) => s.discovered)
  const data = useAppStore((s) => (s.selectedId ? s.siteData[s.selectedId] : null))

  // 선택한 장소의 TourAPI·국가유산 결과를 3D 마커로 바꿔 씬에 전달
  const weather = data?.weather?.ok ? data.weather.data : null
  const nearby = useMemo(() => {
    const ok = (v) => Number.isFinite(v) && v > 0
    const tour = (data?.tour?.ok ? data.tour.data : []).map((p) => ({ ...p, kind: 'tour' }))
    const her = (data?.heritage?.ok ? data.heritage.data : []).map((h) => ({ ...h, title: h.name, kind: 'heritage' }))
    return [...tour, ...her].filter((m) => ok(m.lat) && ok(m.lng))
  }, [data])

  return (
    <main className="map-page">
      <Suspense fallback={<div className="loading-3d">신들의 섬을 일으키는 중…</div>}>
        <Scene selectedId={selectedId} onSelect={select} discovered={discovered} weather={weather} nearby={nearby} />
      </Suspense>

      {!selectedId && (
        <section className="hero">
          <p className="eyebrow">18,000 신들의 섬</p>
          <h1>신화가 깃든 자리에<br />오늘의 공공데이터를 겹쳐 보다</h1>
          <p className="sub">
            설문대할망이 쌓은 한라산, 영등할망이 건너오는 포구, 삼성혈의 세 신인.
            빛나는 별을 눌러 이야기를 읽고, 그 자리의 날씨·명소·국가유산을 확인하세요.
          </p>
          <p className="hint">드래그로 돌리고, 스크롤로 확대 · 별을 눌러 보세요</p>
        </section>
      )}

      <div className="hud">
        <Badge pill><b>{discovered.length}</b> / {MYTHS.length} 기록</Badge>
        <Badge pill><i className="lg-site" />신화 장소</Badge>
        <Badge pill><i className="lg-tour" />주변 명소</Badge>
        <Badge pill><i className="lg-her" />국가유산</Badge>
      </div>

      {selectedId && <SitePanel key={selectedId} id={selectedId} />}
    </main>
  )
}
