import { Link } from 'react-router-dom'
import { Button } from 'react-bootstrap'

export default function NotFound() {
  return (
    <main className="page narrow" style={{ textAlign: 'center', paddingTop: '30vh' }}>
      <p className="eyebrow">404</p>
      <h1>길을 잃었어요</h1>
      <p className="muted">신들도 가끔 길을 잃는답니다.</p>
      <Button as={Link} to="/">신화 지도로 돌아가기</Button>
    </main>
  )
}
