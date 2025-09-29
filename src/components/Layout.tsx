import { Outlet, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import './Layout.css';

export default function Layout() {
  return (
    <div>
      <nav className="nav-bar">
        <div className="nav-container">
          {/* ロゴ */}
          <Link 
            to="/" 
            className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-500"
          >
            MyFMS
          </Link>
        </div>
      </nav>
      
      <main className="main-content">
        <Outlet />
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 58, 138, 0.9)', // 濃い青系の半透明な背景
            color: '#e2e8f0',                  // 明るいグレーの文字色
            border: '1px solid #334155',       // 少し明るいボーダー
          },
        }}
      />
    </div>
  );
}