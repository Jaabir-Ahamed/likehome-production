import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
  const isDark = localStorage.getItem("darkMode") === "true";

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  return <AuthProvider>
    <RouterProvider router={router}/>
  </AuthProvider>
  ;
}
