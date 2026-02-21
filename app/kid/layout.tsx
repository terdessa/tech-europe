"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth-client";
import { useAppStore } from "@/store/useAppStore";
import { getChildrenForParent } from "@/lib/db-client";
import { QuillLoading } from "@/components/ui/StoryBookUI";

export default function KidLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { uid, setAuth, setChildren, setAuthLoading } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setAuth(user.uid, user.email, user.displayName);
      getChildrenForParent(user.uid).then(setChildren).catch(() => {});
      setReady(true);
    } else {
      router.replace("/login");
    }
    setAuthLoading(false);
  }, [setAuth, setChildren, setAuthLoading, router]);

  if (!ready) {
    return (
      <div className="storybook-page flex items-center justify-center min-h-screen">
        <QuillLoading text="Opening the storybook..." />
      </div>
    );
  }

  return <>{children}</>;
}
