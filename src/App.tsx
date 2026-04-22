/* src/App.tsx */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SidebarProvider } from "./contexts/SidebarContext";
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
    ]
  },
]);

export default function App() {
  return (
    <SidebarProvider>
      <RouterProvider router={router} />
    </SidebarProvider>
  );
}