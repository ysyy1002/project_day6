import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Form, InputGroup, ListGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/useAppStore'

const TOOL_LABEL = {
  get_myth_lore: '신화 도감',
  get_weather: '기상청 예보',
  search_tour_places: '관광공사 TourAPI',
  search_heritage: '국가유산청',
}
const SUGGEST = [
  '설문대할망 이야기가 깃든 곳 중 오늘 날씨가 가장 좋은 곳은?',
  '영등할망이 오는 포구 근처에서 볼 만한 곳 알려줘',
  '산방덕이 이야기를 보고 나서 갈 만한 주변 명소는?',
]

export default function Oracle() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const { sendMessage, clearChat } = useAppStore.getState()
  const [input, setInput] = useState('')
  const end = useRef(null)

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function submit(text) {
    if (!text.trim() || loading) return
    sendMessage(text.trim())
    setInput('')
  }

  return (
    <main className="page narrow">
      <PageHeader eyebrow="AI 에이전트" title="할망에게 묻기"
        subtitle="할망은 질문에 맞는 공공데이터 API를 스스로 골라 호출하고, 그 결과로 답해요. 어떤 도구를 불렀는지 답 위에 그대로 보여주고, 대화는 닉네임별로 저장돼 다시 열어도 이어집니다." />

      <div className="chat">
        {messages.length === 0 && (
          <ListGroup className="suggest">
            {SUGGEST.map((s) => <ListGroup.Item action key={s} onClick={() => submit(s)} className="bg-transparent text-light">{s}</ListGroup.Item>)}
          </ListGroup>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.steps?.length > 0 && (
              <div className="steps">
                <span className="steps-h"><i className="bi bi-tools me-1" />호출한 도구</span>
                {m.steps.map((s, j) => (
                  <Badge pill key={j} className={`step${s.error ? ' bad' : ''}`} title={JSON.stringify(s.args)}>
                    {TOOL_LABEL[s.tool] ?? s.tool}
                    <em>{Object.values(s.args ?? {}).join(' · ')}</em>
                    <b>{s.error ? '실패' : `${s.count}건`}</b>
                  </Badge>
                ))}
              </div>
            )}
            <p>{m.text}</p>
          </div>
        ))}
        {loading && <div className="msg assistant"><p className="muted pulse"><Spinner size="sm" className="me-2" />할망이 도구를 고르는 중…</p></div>}
        <div ref={end} />
      </div>

      <Form onSubmit={(e) => { e.preventDefault(); submit(input) }}>
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder="신화와 날씨, 명소를 함께 물어보세요" />
          <Button type="submit" disabled={loading}><i className="bi bi-send" /></Button>
          {messages.length > 0 && (
            <Button variant="outline-light" title="저장된 대화 지우기"
              onClick={() => window.confirm('이 닉네임의 저장된 대화를 모두 지울까요?') && clearChat()}>
              <i className="bi bi-trash" />
            </Button>
          )}
        </InputGroup>
      </Form>
    </main>
  )
}
