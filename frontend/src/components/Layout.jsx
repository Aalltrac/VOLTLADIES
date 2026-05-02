import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="relative z-10 min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-10 py-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
