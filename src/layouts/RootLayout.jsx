import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import Toasts from '../components/Toasts'
import { useAppStore } from '../store/useAppStore'

export default function RootLayout() {
  const nickname = useAppStore((s) => s.nickname)
  const { pathname } = useLocation()

  // 닉네임이 바뀔 때마다 Supabase 에서 그 사람의 즐겨찾기·도감을 다시 불러온다
  useEffect(() => {
    const { loadFavorites, loadDiscoveries } = useAppStore.getState()
    loadFavorites()
    loadDiscoveries()
  }, [nickname])

  return (
    <div className={`app${pathname === '/' ? ' app-map' : ''}`}>
      <Navbar expand="md" fixed="top" variant="dark" className="topbar">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/"><i className="bi bi-gem me-2" />신들의 섬</Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="ms-auto me-md-3">
              {NAV_ITEMS.map((n) => (
                <Nav.Link key={n.to} as={NavLink} to={n.to} end={n.to === '/'}>{n.label}</Nav.Link>
              ))}
            </Nav>
            <Navbar.Text className="who"><i className="bi bi-person me-1" />{nickname || '익명 여행자'}</Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Outlet />
      <Toasts />
    </div>
  )
}
