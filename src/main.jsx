import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// ── 디자인 ───────────────────────────────────────────────
// Bootstrap 5 + Bootswatch 'darkly'(다크) 테마 위에, theme.css 에서 금색 포인트와 밤하늘 배경을 덮어쓴다.
// 테마를 바꾸려면 아래 'darkly' 한 단어만 바꾸면 된다. (예: cyborg · slate · superhero · vapor)
import 'bootswatch/dist/darkly/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'
import { router } from './router'

// StrictMode 는 일부러 뺐다: R3F(Canvas)가 개발 모드에서 StrictMode 와 만나면 unmount 경고를 반복해서 낸다
createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
