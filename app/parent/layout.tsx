"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import AppShell from "@/components/shared/AppShell";
import Sidebar from "@/components/parent/Sidebar";
import ChildSwitcher from "@/components/shared/ChildSwitcher";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { uid, isAuthLoading, isSidebarOpen, toggleSidebar } = useAppStore();

  useEffect(() => {
    if (!isAuthLoading && !uid) {
      router.push("/login");
    }
  }, [uid, isAuthLoading, router]);

  return (
    <AppShell>
      <div className="min-h-screen storybook-page">
        <Sidebar />
        <main
          className={`transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <header className="sticky top-0 z-30 bg-ink-900/80 backdrop-blur-sm border-b border-gold-500/10 px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-sm hover:bg-ink-800 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-parchment-300">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <ChildSwitcher />
            </div>
          </header>
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AppShell>
  );
}
