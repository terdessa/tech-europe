"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { getRecentDailyAnalytics, getAlerts, getMissions } from "@/lib/db-client";
import WeeklyInsightCard from "@/components/parent/WeeklyInsightCard";
import MoodTrendChart from "@/components/parent/MoodTrendChart";
import AlertsPanel from "@/components/parent/AlertsPanel";
import { ParchmentCard, OrnateButton, QuillLoading } from "@/components/ui/StoryBookUI";
import ParentGate from "@/components/shared/ParentGate";
import type { Alert, Mission, DailyAnalytics } from "@/types/domain";

export default function DashboardPage() {
  const router = useRouter();
  const { activeChildId, children } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState<{ date: string; data: DailyAnalytics }[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showGate, setShowGate] = useState(false);

  const activeChild = children.find((c) => c.id === activeChildId);

  const loadData = useCallback(async () => {
    if (!activeChildId) return;
    setLoading(true);
    try {
      const [analyticsData, alertsData, missionsData] = await Promise.all([
        getRecentDailyAnalytics(activeChildId, 7),
        getAlerts(activeChildId),
        getMissions(activeChildId),
      ]);
      setMoodData(analyticsData);
      setAlerts(alertsData);
      setMissions(missionsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => { loadData(); }, [loadData]);

  const chartData = moodData.map(({ date, data }) => ({
    date,
    happy: data.moodBreakdown?.happy || 0,
    calm: data.moodBreakdown?.calm || 0,
    worried: data.moodBreakdown?.worried || 0,
    sad: data.moodBreakdown?.sad || 0,
    excited: data.moodBreakdown?.excited || 0,
    angry: data.moodBreakdown?.angry || 0,
    neutral: data.moodBreakdown?.neutral || 0,
  }));

  const activeMissions = missions.filter((m) => m.status === "active");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <QuillLoading text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Dashboard</h1>
          {activeChild && (
            <p className="text-parchment-500 font-crimson">Overview for {activeChild.name}</p>
          )}
        </div>
        {activeChild && (
          <OrnateButton variant="primary" onClick={() => setShowGate(true)}>
            Open Kid Chat
          </OrnateButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <MoodTrendChart data={chartData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <WeeklyInsightCard />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AlertsPanel alerts={alerts} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <ParchmentCard>
            <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Active Missions</h3>
            {activeMissions.length === 0 ? (
              <p className="text-parchment-500 font-crimson text-sm italic text-center py-4">
                No active missions. Create one from the Missions page.
              </p>
            ) : (
              <div className="space-y-2">
                {activeMissions.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-3 rounded-sm bg-forest-900/30 border border-forest-600/20">
                    <p className="text-sm font-cinzel font-medium text-parchment-200">{m.title}</p>
                    <p className="text-xs text-parchment-500 font-crimson mt-1">{m.description}</p>
                  </div>
                ))}
                {activeMissions.length > 3 && (
                  <button
                    onClick={() => router.push("/parent/missions")}
                    className="text-sm text-gold-400 hover:text-gold-300 font-crimson"
                  >
                    View all {activeMissions.length} missions →
                  </button>
                )}
              </div>
            )}
          </ParchmentCard>
        </motion.div>
      </div>

      <ParentGate
        isOpen={showGate}
        onPass={() => {
          setShowGate(false);
          if (activeChildId) router.push(`/kid/${activeChildId}/home`);
        }}
        onCancel={() => setShowGate(false)}
      />
    </div>
  );
}
