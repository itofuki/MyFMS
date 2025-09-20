// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'

// 各ページのコンポーネントをインポート
import LoginForm from './services/LoginForm';
import RegisterForm from './services/RegisterForm';

// ルート設定を作成
const router = createBrowserRouter([
  {
    path: "/login", // "/login" というURLで
    element: <LoginForm />, // LoginFormコンポーネントを表示
  },
  {
    path: "/register", // "/register" というURLで
    element: <RegisterForm />, // RegisterFormコンポーネントを表示
  },
  {
    path: "/", // ルートURLでは
    element: <RegisterForm />, // デフォルトで登録フォームを表示（またはログインフォーム）
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)