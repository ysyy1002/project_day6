import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import Codex from './pages/Codex'
import Oracle from './pages/Oracle'
import Journey from './pages/Journey'
import NotFound from './pages/NotFound'

// 페이지를 추가할 때: ① pages/에 파일 만들기 ② NAV_ITEMS 에 한 줄 ③ routes 에 한 줄
export const NAV_ITEMS = [
  { to: '/', label: '신화 지도' },
  { to: '/codex', label: '신화 도감' },
  { to: '/oracle', label: '할망에게 묻기' },
  { to: '/journey', label: '내 여정' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'codex', element: <Codex /> },
      { path: 'oracle', element: <Oracle /> },
      { path: 'journey', element: <Journey /> },
    ],
  },
])
