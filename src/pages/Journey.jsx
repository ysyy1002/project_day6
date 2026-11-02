import { useState } from 'react'
import { Alert, Badge, Button, Form, InputGroup, ListGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { MYTHS } from '../data/myths'
import { isSupabaseReady } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

const SOURCE = { tour: '주변 명소', heritage: '국가유산' }

export default function Journey() {
  const nickname = useAppStore((s) => s.nickname)
  const favorites = useAppStore((s) => s.favorites)
  const loading = useAppStore((s) => s.favLoading)
  const discovered = useAppStore((s) => s.discovered)
  const { setNickname, removeFavorite } = useAppStore.getState()
  const [name, setName] = useState(nickname)

  return (
    <main className="page narrow">
      <PageHeader eyebrow="내 여정" title="담아 둔 곳과 읽은 이야기" subtitle="닉네임별로 도감과 즐겨찾기가 따로 저장돼요." />

      {!isSupabaseReady && (
        <Alert variant="warning">Supabase 가 설정되지 않아 이 브라우저에만 저장 중이에요 (.env.local 확인).</Alert>
      )}

      <Form onSubmit={(e) => { e.preventDefault(); setNickname(name) }}>
        <InputGroup>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="닉네임 (비워 두면 익명)" maxLength={20} />
          <Button type="submit">닉네임 적용</Button>
        </InputGroup>
      </Form>

      <h3 className="sec">도감 {discovered.length} / {MYTHS.length}</h3>
      <div className="d-flex flex-wrap gap-2">
        {MYTHS.map((m) => (
          <Badge pill key={m.id} className={`chip${discovered.includes(m.id) ? ' on' : ''}`} style={{ '--c': m.color }}>{m.name}</Badge>
        ))}
      </div>

      <h3 className="sec">담아 둔 곳 {favorites.length}</h3>
      {loading && <p className="muted"><Spinner size="sm" className="me-2" />불러오는 중…</p>}
      {!loading && favorites.length === 0 && <p className="muted">지도에서 주변 명소·국가유산의 ☆ 를 눌러 담아 보세요.</p>}
      {favorites.length > 0 && (
        <ListGroup variant="flush" className="items boxed">
          {favorites.map((f) => (
            <ListGroup.Item className="item" key={f.id}>
              <div className="item-txt"><b>{f.title}</b><small>{SOURCE[f.source] ?? f.source}</small></div>
              <Button variant="link" className="btn-star" onClick={() => removeFavorite(f.id)} aria-label="삭제" title="삭제"><i className="bi bi-x-lg" /></Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </main>
  )
}
