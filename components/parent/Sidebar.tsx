"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { localSignOut } from "@/lib/auth-client";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";

const navItems = [
  { href: "/parent/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/parent/kid-details", label: "Kid details", icon: "👤" },
  { href: "/parent/insights", label: "Insights", icon: "💡" },
  { href: "/parent/missions", label: "Missions", icon: "🎯" },
  { href: "/parent/history", label: "Chat History", icon: "💬" },
  { href: "/parent/adviser", label: "Adviser", icon: "🧭" },
  { href: "/parent/audit", label: "Safety Audit", icon: "🛡️" },
  { href: "/parent/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, isSidebarOpen, reset } = useAppStore();

  function handleSignOut() {
    localSignOut();
    reset();
    router.push("/login");
  }

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-full bg-ink-900 border-r border-gold-500/10 z-40
                  flex flex-col transition-all duration-300 ${
                    isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
                  }`}
      initial={false}
    >
      <div className="p-6 border-b border-gold-500/10">
        <Link href="/parent/dashboard">
          <h1 className="text-2xl font-cinzel font-bold gold-shimmer">
            LUMIO
          </h1>
        </Link>
        {displayName && (
          <p className="text-sm text-parchment-500 font-crimson mt-1">
            Hi, {displayName}
          </p>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 font-crimson text-sm transition-colors
                ${
                  isActive
                    ? "bg-gold-500/10 text-gold-400 font-semibold border-r-4 border-gold-500"
                    : "text-parchment-400 hover:bg-ink-800 hover:text-parchment-200"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gold-500/10 space-y-2">
        <button
          onClick={() => router.push("/kid/library")}
          className="w-full text-left px-4 py-2 text-sm text-gold-400 font-crimson
                     hover:bg-gold-500/10 rounded-sm transition-colors"
        >
          Open Kid View
        </button>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2 text-sm text-parchment-500 font-crimson
                     hover:bg-ink-800 rounded-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
