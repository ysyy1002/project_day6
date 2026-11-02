import { Badge } from 'react-bootstrap'

// API 호출 결과({ ok, data | error })를 "성공 / 빈 결과 / 실패" 세 갈래로 보여주는 공용 조각
export default function ApiState({ label, res, empty, children }) {
  if (!res) return null
  return (
    <div className="api">
      <Badge pill bg={res.ok ? 'success' : 'danger'} className="mb-2 fw-normal">
        <i className={`bi ${res.ok ? 'bi-check-circle' : 'bi-x-circle'} me-1`} />
        {label} · {res.ok ? `${res.data.length}건` : '실패'}
      </Badge>
      {!res.ok && <p className="api-err">{res.error}</p>}
      {res.ok && res.data.length === 0 && <p className="muted">{empty}</p>}
      {res.ok && res.data.length > 0 && children(res.data)}
    </div>
  )
}
