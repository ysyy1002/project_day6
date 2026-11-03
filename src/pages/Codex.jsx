import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, ProgressBar, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { MYTHS } from '../data/myths'
import { useAppStore } from '../store/useAppStore'

export default function Codex() {
  const discovered = useAppStore((s) => s.discovered)
  const { toggleDiscovery, select } = useAppStore.getState()
  const navigate = useNavigate()
  const [open, setOpen] = useState(null)

  const goMap = (id) => { select(id); navigate('/') }

  return (
    <main className="page">
      <PageHeader eyebrow="신화 도감" title="아홉 개의 이야기" subtitle="읽은 이야기는 도감에 기록돼요. 기록은 Supabase에 저장되어 새로고침해도 남습니다.">
        <ProgressBar now={(discovered.length / MYTHS.length) * 100} />
        <p className="muted">{discovered.length} / {MYTHS.length} 기록됨</p>
      </PageHeader>

      <Row xs={1} md={2} lg={3} className="g-3">
        {MYTHS.map((m) => {
          const done = discovered.includes(m.id)
          const isOpen = open === m.id
          return (
            <Col key={m.id}>
              <Card className={`myth-card${done ? ' done' : ''}`} style={{ '--c': m.color }}>
                <Card.Body>
                  <p className="eyebrow">{m.element}</p>
                  <Card.Title as="h3">{m.name}</Card.Title>
                  <p className="deity">{m.deity}</p>
                  <p className={`story${isOpen ? '' : ' clamp'}`}>{m.story}</p>
                  <div className="d-flex gap-3 flex-wrap">
                    <Button variant="link" size="sm" className="p-0" onClick={() => setOpen(isOpen ? null : m.id)}>{isOpen ? '접기' : '이야기 펼치기'}</Button>
                    <Button variant="link" size="sm" className="p-0" onClick={() => goMap(m.id)}>3D 지도에서 보기</Button>
                    <Button variant="link" size="sm" className="p-0" aria-pressed={done}
                      title={done ? '다시 누르면 기록이 해제돼요' : '이야기 도감에 기록'} onClick={() => toggleDiscovery(m.id)}>
                      {done ? <><i className="bi bi-check2" /> 기록됨 · 해제</> : '기록하기'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>
    </main>
  )
}
