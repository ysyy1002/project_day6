import { useState } from 'react'
import { Button, Card, ListGroup, Nav, Spinner } from 'react-bootstrap'
import { MYTH_BY_ID } from '../data/myths'
import { useAppStore } from '../store/useAppStore'
import ApiState from './ApiState'

const hour = (t) => `${t.slice(-4, -2)}시`
const skyIcon = (w) => (w.rain !== '없음' ? 'bi-cloud-rain' : w.sky === '맑음' ? 'bi-sun' : w.sky === '흐림' ? 'bi-clouds' : 'bi-cloud-sun')

function Weather({ res }) {
  return (
    <ApiState label="기상청 단기예보" res={res} empty="예보가 없어요">
      {(rows) => (
        <div className="wx-row">
          {rows.map((w) => (
            <div className={`wx${w.rain !== '없음' ? ' wet' : ''}`} key={w.time}>
              <span className="wx-h">{hour(w.time)}</span>
              <i className={`bi ${skyIcon(w)} wx-g`} />
              <b>{w.temp}°</b>
              <span className="wx-s">{w.pop}% · {w.wind}m/s</span>
            </div>
          ))}
        </div>
      )}
    </ApiState>
  )
}

function Item({ title, sub, image, onSave, saved }) {
  return (
    <ListGroup.Item className="item">
      {image ? <img src={image} alt="" loading="lazy" /> : <span className="item-ph" />}
      <div className="item-txt">
        <b>{title}</b>
        <small>{sub}</small>
      </div>
      <Button variant="link" className={`btn-star${saved ? ' on' : ''}`} onClick={onSave}
        aria-label={saved ? '저장 해제' : '담기'} aria-pressed={saved} title={saved ? '저장 해제' : '여정에 담기'}>
        <i className={`bi ${saved ? 'bi-star-fill' : 'bi-star'}`} />
      </Button>
    </ListGroup.Item>
  )
}

export default function SitePanel({ id }) {
  const site = MYTH_BY_ID[id]
  const data = useAppStore((s) => s.siteData[id])
  const discovered = useAppStore((s) => s.discovered.includes(id))
  const favorites = useAppStore((s) => s.favorites)
  const { toggleDiscovery, toggleFavorite, select, loadSite } = useAppStore.getState()
  const [tab, setTab] = useState('tour')
  const isSaved = (source, item_id) => favorites.some((f) => f.source === source && f.item_id === String(item_id))
  const ready = data && !data.loading

  return (
    <Card as="aside" className="panel">
      <Button variant="link" className="panel-x text-secondary" onClick={() => select(null)} aria-label="닫기"><i className="bi bi-x-lg" /></Button>
      <Card.Body>
        <p className="eyebrow" style={{ color: site.color }}>{site.element} · {site.deity}</p>
        <h2>{site.name}</h2>
        <p className="story">{site.story}</p>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant={discovered ? 'outline-light' : 'primary'} size="sm" aria-pressed={discovered}
            title={discovered ? '다시 누르면 기록이 해제돼요' : '이야기 도감에 기록'} onClick={() => toggleDiscovery(id)}>
            <i className={`bi ${discovered ? 'bi-check2' : 'bi-journal-bookmark'} me-1`} />{discovered ? '도감에 기록됨 · 해제' : '이야기 도감에 기록'}
          </Button>
          <Button variant="outline-light" size="sm" onClick={() => loadSite(id, true)}>
            <i className="bi bi-arrow-clockwise me-1" />데이터 새로고침
          </Button>
        </div>

        <h3>지금 이곳의 하늘</h3>
        {!ready ? <p className="muted"><Spinner size="sm" className="me-2" />공공데이터를 불러오는 중…</p> : <Weather res={data.weather} />}

        <Nav variant="tabs" activeKey={tab} onSelect={setTab}>
          <Nav.Item><Nav.Link eventKey="tour">주변 명소</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="heritage">국가유산</Nav.Link></Nav.Item>
        </Nav>
        {ready && tab === 'tour' && (
          <ApiState label="한국관광공사 TourAPI" res={data.tour} empty="반경 8km 안에 결과가 없어요">
            {(rows) => (
              <ListGroup variant="flush" className="items">
                {rows.map((p) => (
                  <Item key={p.id} title={p.title} image={p.image} saved={isSaved('tour', p.id)}
                    sub={`${p.addr ?? ''}${p.dist ? ` · ${(p.dist / 1000).toFixed(1)}km` : ''}`}
                    onSave={() => toggleFavorite({ source: 'tour', id: p.id, title: p.title })} />
                ))}
              </ListGroup>
            )}
          </ApiState>
        )}
        {ready && tab === 'heritage' && (
          <ApiState label="국가유산청 오픈API" res={data.heritage} empty={`‘${site.heritageKeyword}’ 로 찾은 제주 국가유산이 없어요`}>
            {(rows) => (
              <ListGroup variant="flush" className="items">
                {rows.map((h) => (
                  <Item key={h.id} title={h.name} sub={`${h.kind ?? ''} · ${h.city ?? ''}`} saved={isSaved('heritage', h.id)}
                    onSave={() => toggleFavorite({ source: 'heritage', id: h.id, title: h.name })} />
                ))}
              </ListGroup>
            )}
          </ApiState>
        )}
      </Card.Body>
    </Card>
  )
}
