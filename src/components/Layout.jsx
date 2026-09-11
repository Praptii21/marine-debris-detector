import { Link, NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/upload', label: 'Upload' },
  { to: '/review', label: 'Review' },
  { to: '/map', label: 'Map' },
  { to: '/reports', label: 'Reports' },
]

export default function Layout() {
  return (
    <div>
      <nav
        style={{
          background: 'var(--panel)',
          borderBottom: '1px solid var(--border)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          height: 64,
          gap: 36,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, flex: 'none' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--ocean)" strokeWidth="1.6">
            <path d="M3 12h4l2-6 4 12 2-6h6" />
          </svg>
          AquaScan
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 400, marginLeft: 2 }}>
            Seabed Debris Detection Platform
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                padding: '9px 15px',
                borderRadius: 20,
                fontSize: 13.5,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--ink-dim)',
                background: isActive ? 'var(--ocean-deep)' : 'transparent',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        {/* <Link to="/upload" className="btn" style={{ flex: 'none', padding: '9px 18px', fontSize: 13, textDecoration: 'none' }}>
          Upload
        </Link> */}
      </nav>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 80px' }}>
        <Outlet />
      </main>
    </div>
  )
}
