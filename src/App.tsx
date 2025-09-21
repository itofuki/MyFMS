/* src/App.tsx */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from './components/Layout';
import HomePage from "./pages/HomePage";
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import MyPage from "./pages/MyPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />, // 👈 2. ルートパスにHomePageを設定
      },
      {
        path: "login",
        element: <LoginForm />,
      },
      {
        path: "register",
        element: <RegisterForm />,
      },
      {
        path: "mypage", // 👈 3. 新しいルートを追加
        element: <MyPage />,
      },
    ]
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}