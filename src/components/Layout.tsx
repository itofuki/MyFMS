import { Outlet, Link } from "react-router-dom";

const headerStyle: React.CSSProperties = {
  padding: '1rem',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  textAlign: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
};

const linkStyle: React.CSSProperties = {
  color: '#61dafb',
  textDecoration: 'none',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

export default function Layout() {
  return (
    <div>
      <header style={headerStyle}>
        <Link to="/" style={linkStyle}>
          FMS
        </Link>
      </header>
      
      <main>
        {/* Page content will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
}
