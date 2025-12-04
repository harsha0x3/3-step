// src/layouts/RootLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "@/layouts/Header";

const RootLayout: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <div className="container mx-auto py-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
