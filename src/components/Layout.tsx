import { Outlet, Link } from "react-router-dom";
import './Layout.css'; // 作成したCSSファイルをインポート

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
    </div>
  );
}