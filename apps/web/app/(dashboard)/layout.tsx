"use client";

import { useState } from "react";
import { Sidebar } from "./components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((p) => !p)} />

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setSidebarOpen((p) => !p)}
        className="fixed left-4 top-3.5 z-50 flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Content area */}
      <main
        className={`min-h-screen flex-1 transition-all duration-200 ${
          sidebarOpen ? "lg:ml-60" : "lg:ml-16"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
