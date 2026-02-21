"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { getChild } from "@/lib/db-client";
import { QuillLoading, FloatingParticles } from "@/components/ui/StoryBookUI";
import type { Child } from "@/types/domain";

export default function KidChildLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;
  const { uid, isAuthLoading } = useAppStore();
  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !uid) {
      router.push("/login");
      return;
    }

    if (childId) {
      getChild(childId).then((c) => {
        if (!c || c.parentId !== uid) {
          router.push("/kid/library");
          return;
        }
        setChild(c);
      });
    }
  }, [uid, isAuthLoading, childId, router]);

  return (
    <div className="storybook-page min-h-screen relative overflow-hidden">
      <FloatingParticles count={10} />
      <div className="relative z-10 min-h-screen flex flex-col">
        {child ? (
          children
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <QuillLoading text="Opening the storybook..." />
          </div>
        )}
      </div>
    </div>
  );
}
