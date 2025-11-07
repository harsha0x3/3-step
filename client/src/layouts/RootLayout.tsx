import type React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import Header from "./Header";

const RootLayout: React.FC = () => {
  return (
    <div className="w-full h-full">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
