"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth-client";
import { QuillLoading } from "@/components/ui/StoryBookUI";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace("/kid/library");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="storybook-page flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-cinzel font-bold gold-shimmer mb-6">
          LUMIO
        </h1>
        <QuillLoading text="Opening the storybook..." />
      </div>
    </div>
  );
}
