"use client";

import { useEffect } from "react";
import { getStoredUser } from "@/lib/auth-client";
import { useAppStore } from "@/store/useAppStore";
import { getChildrenForParent } from "@/lib/db-client";
import { QuillLoading } from "@/components/ui/StoryBookUI";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { setAuth, setChildren, setAuthLoading, isAuthLoading } =
    useAppStore();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setAuth(user.uid, user.email, user.displayName);
      getChildrenForParent(user.uid).then(setChildren).catch(() => {});
    } else {
      setAuth(null, null, null);
      setChildren([]);
    }
    setAuthLoading(false);
  }, [setAuth, setChildren, setAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen storybook-page">
        <div className="text-center">
          <h1 className="text-4xl font-cinzel font-bold gold-shimmer mb-6">
            LUMIO
          </h1>
          <QuillLoading text="Loading..." />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
