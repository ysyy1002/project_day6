import { Toast, ToastContainer } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'

export default function Toasts() {
  const toasts = useAppStore((s) => s.toasts)
  return (
    <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 100, position: 'fixed' }}>
      {toasts.map((t) => (
        <Toast key={t.id} show bg={t.variant === 'bad' ? 'danger' : 'dark'}>
          <Toast.Body className="text-white">{t.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  )
}
