"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ParchmentCard } from "@/components/ui/StoryBookUI";

interface MoodDataPoint {
  date: string;
  happy: number;
  calm: number;
  worried: number;
  sad: number;
  excited: number;
  angry: number;
  neutral: number;
}

interface MoodTrendChartProps {
  data: MoodDataPoint[];
  title?: string;
}

const moodColors = {
  happy: "#DEBA48",
  calm: "#6B9660",
  excited: "#E8CC6E",
  neutral: "#A08970",
  worried: "#6D91B6",
  sad: "#4A6FA5",
  angry: "#8B6B4F",
};

export default function MoodTrendChart({ data, title = "Mood Trends (7 Days)" }: MoodTrendChartProps) {
  if (data.length === 0) {
    return (
      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">{title}</h3>
        <p className="text-parchment-500 font-crimson text-sm italic text-center py-8">
          Mood data will appear after conversations begin.
        </p>
      </ParchmentCard>
    );
  }

  return (
    <ParchmentCard>
      <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A3228" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#A08970" }} tickFormatter={(val: string) => val.slice(5)} />
          <YAxis tick={{ fontSize: 12, fill: "#A08970" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#3A2518",
              borderRadius: "4px",
              border: "1px solid rgba(212,175,55,0.2)",
              fontFamily: "Crimson Text",
              color: "#F4E8D0",
            }}
          />
          <Area type="monotone" dataKey="happy" stackId="1" stroke={moodColors.happy} fill={moodColors.happy} fillOpacity={0.6} />
          <Area type="monotone" dataKey="calm" stackId="1" stroke={moodColors.calm} fill={moodColors.calm} fillOpacity={0.6} />
          <Area type="monotone" dataKey="excited" stackId="1" stroke={moodColors.excited} fill={moodColors.excited} fillOpacity={0.6} />
          <Area type="monotone" dataKey="neutral" stackId="1" stroke={moodColors.neutral} fill={moodColors.neutral} fillOpacity={0.6} />
          <Area type="monotone" dataKey="worried" stackId="1" stroke={moodColors.worried} fill={moodColors.worried} fillOpacity={0.6} />
          <Area type="monotone" dataKey="sad" stackId="1" stroke={moodColors.sad} fill={moodColors.sad} fillOpacity={0.6} />
          <Area type="monotone" dataKey="angry" stackId="1" stroke={moodColors.angry} fill={moodColors.angry} fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </ParchmentCard>
  );
}
