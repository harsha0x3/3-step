import type React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import Header from "./Header";

const RootLayout: React.FC = () => {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {/* pb-16 adds padding bottom on mobile to account for fixed nav */}
          <Header />
          <div className="p-4">
            {/* Add padding to content area */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
