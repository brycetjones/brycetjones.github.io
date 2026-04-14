import { Link, useLocation } from 'react-router-dom'
import './NavBar.css'

const LINES = [
  { label: 'HOME', path: '/', color: '#E3001B' },
  { label: 'RESUME', path: '/resume', color: '#0065BD' },
  { label: 'PROJECTS', path: '/projects', color: '#D4861A' },
]

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="brand-bullet" style={{ background: '#E3001B' }}></span>
          <span className="brand-bullet" style={{ background: '#0065BD' }}></span>
          <span className="brand-bullet" style={{ background: '#D4861A' }}></span>
          <span className="brand-bullet" style={{ background: '#00A651' }}></span>
          <span className="brand-name">TN</span>
        </div>
        <div className="navbar-links">
          {LINES.map(({ label, path, color }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${pathname === path ? 'active' : ''}`}
              style={{ '--line-color': color }}
            >
              <span className="nav-bullet" style={{ background: color }}></span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
