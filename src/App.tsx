/* src/App.tsx */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from './components/Layout';
import HomePage from "./pages/HomePage";
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import MyPage from "./pages/MyPage";
import Setting from "./pages/Setting";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
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
        path: "mypage",
        element: <MyPage />,
      },
      {
        path: "/setting", // 新しいページのパス
        element: <Setting />, // 新しいページコンポーネント
      },
    ]
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}