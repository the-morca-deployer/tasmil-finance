"use client";

import { Check, ChevronRight, Gauge, Loader2, RefreshCw, Target, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  icon: "activate" | "harvest" | "streak" | "tvl";
}

const DAILY_MISSIONS: Mission[] = [
  {
    id: "daily-activate",
    title: "Strategy Activated",
    description: "Activate any strategy on your vault",
    type: "AGENT_ACTIVATE",
    progress: 0,
    target: 1,
    reward: 50,
    completed: false,
    icon: "activate",
  },
  {
    id: "daily-harvest",
    title: "Harvest Profits",
    description: "Call harvest on your strategy 3 times",
    type: "AGENT_HARVEST",
    progress: 0,
    target: 3,
    reward: 100,
    completed: false,
    icon: "harvest",
  },
  {
    id: "daily-tvl",
    title: "Maintain TVL",
    description: "Keep at least $100 TVL in your vault",
    type: "AGENT_TVL",
    progress: 0,
    target: 100,
    reward: 75,
    completed: false,
    icon: "tvl",
  },
  {
    id: "daily-streak",
    title: "Daily Streak",
    description: "Log in daily for 3 consecutive days",
    type: "AGENT_DAILY_STREAK",
    progress: 0,
    target: 3,
    reward: 200,
    completed: false,
    icon: "streak",
  },
];

const MISSION_ICONS = {
  activate: Target,
  harvest: Zap,
  streak: RefreshCw,
  tvl: Gauge,
};

export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>(DAILY_MISSIONS);
  const [claiming, setClaiming] = useState<string | null>(null);

  const handleClaim = async (id: string) => {
    setClaiming(id);
    await new Promise((r) => setTimeout(r, 800));
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, completed: true } : m)));
    setClaiming(null);
  };

  const completed = missions.filter((m) => m.completed).length;
  const totalReward = missions.filter((m) => m.completed).reduce((a, m) => a + m.reward, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Missions</h1>
          <p className="mt-1 text-sm text-white/40">Complete missions to earn credits</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-400">{totalReward}</div>
          <div className="text-xs text-white/30">credits earned</div>
        </div>
      </div>

      {/* Progress bar */}
      <Card className="mt-6 border-white/5 bg-white/3 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Daily Progress</span>
          <span className="text-white">
            {completed}/{missions.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(completed / missions.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Mission list */}
      <div className="mt-6 space-y-3">
        {missions.map((mission) => {
          const Icon = MISSION_ICONS[mission.icon];
          const isComplete = mission.completed;
          return (
            <div
              key={mission.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 transition-all",
                isComplete
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/5 bg-white/3 hover:border-white/10"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
                )}
              >
                {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{mission.title}</span>
                  <span className="text-xs text-yellow-400">+{mission.reward}</span>
                </div>
                <p className="mt-0.5 text-xs text-white/40">{mission.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isComplete ? "bg-emerald-400" : "bg-blue-400"
                      )}
                      style={{
                        width: `${Math.min((mission.progress / mission.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30">
                    {mission.progress}/{mission.target}
                  </span>
                </div>
              </div>

              {isComplete ? (
                <div className="rounded bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-400">
                  Done
                </div>
              ) : (
                <Button
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => handleClaim(mission.id)}
                  disabled={claiming === mission.id}
                >
                  {claiming === mission.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {mission.progress >= mission.target ? "Claim" : "Progress"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
