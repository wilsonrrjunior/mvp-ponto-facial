import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Cadastro from './pages/Cadastro'
import Reconhecer from './pages/Reconhecer'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <nav style={nav.bar}>
          <div style={nav.inner}>
            {/* Logo */}
            <div style={nav.logo}>
              <div style={nav.logoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
              </div>
              <span style={nav.logoText}>Ponto<span style={nav.logoAccent}>Facial</span></span>
            </div>

            {/* Links */}
            <div style={nav.links}>
              <NavLink to="/"        style={({ isActive }) => isActive ? nav.linkActive : nav.link} end>
                <span>Reconhecer</span>
              </NavLink>
              <NavLink to="/cadastro" style={({ isActive }) => isActive ? nav.linkActive : nav.link}>
                <span>Cadastro</span>
              </NavLink>
            </div>

            {/* Badge */}
            <div style={nav.badge}>
              <div style={nav.badgeDot} />
              Sistema Online
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/"        element={<Reconhecer />} />
          <Route path="/reconhecer" element={<Reconhecer />} />
          <Route path="/cadastro"   element={<Cadastro />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

const nav = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(1, 4, 15, 0.85)',
    borderBottom: '1px solid rgba(56,130,246,0.12)',
    boxShadow: '0 1px 0 rgba(56,130,246,0.08), 0 4px 24px rgba(0,0,0,0.4)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginRight: 'auto',
    textDecoration: 'none',
    userSelect: 'none',
  },
  logoIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '9px',
    background: 'linear-gradient(135deg, #2563eb, #00c2ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 0 16px rgba(37,99,235,0.5)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#e8f0fe',
    letterSpacing: '-0.02em',
  },
  logoAccent: {
    background: 'linear-gradient(90deg, #3b82f6, #00c2ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  links: {
    display: 'flex',
    gap: '0.3rem',
  },
  link: {
    color: '#8fafd8',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.9rem',
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.18s',
    border: '1px solid transparent',
  },
  linkActive: {
    color: '#e8f0fe',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    background: 'rgba(37,99,235,0.18)',
    border: '1px solid rgba(59,130,246,0.25)',
    boxShadow: '0 0 12px rgba(37,99,235,0.15)',
    transition: 'all 0.18s',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#05d98a',
    background: 'rgba(5,217,138,0.08)',
    border: '1px solid rgba(5,217,138,0.2)',
    padding: '0.3rem 0.8rem',
    borderRadius: '100px',
    letterSpacing: '0.03em',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#05d98a',
    boxShadow: '0 0 6px #05d98a',
    animation: 'pulse-ring 1.8s ease-out infinite',
  },
}
