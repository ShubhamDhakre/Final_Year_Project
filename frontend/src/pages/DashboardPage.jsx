import React, { useEffect, useState } from "react";
import {
  Mic2,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  FileSearch,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import GlassCard from "../components/GlassCard";
import StatCard from "../components/StatCard";
import Skeleton from "../components/Skeleton";
import PrimaryButton from "../components/PrimaryButton";
import { useToast } from "../context/ToastContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, resumeRes] = await Promise.allSettled([
          api.get("/api/dashboard/stats"),
          api.get("/api/resume/latest"),
        ]);

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data?.data);
        }
        if (resumeRes.status === "fulfilled") {
          setResumeData(resumeRes.value.data?.data);
        }
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load dashboard data";
        addToast(msg, "error");
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [addToast]);

  const sessionHistory = React.useMemo(() => stats?.history || [], [stats]);

  const improvementPercent = React.useMemo(() => {
    if (!sessionHistory.length) return 0;
    const first = sessionHistory[0].average_confidence_score || 0;
    const last = sessionHistory[sessionHistory.length - 1].average_confidence_score || 0;
    if (first === 0) return last > 0 ? 100 : 0;
    return Math.max(-100, Math.min(100, ((last - first) / first) * 100));
  }, [sessionHistory]);

  const chartData = React.useMemo(() => {
    if (!sessionHistory.length) return null;
    return {
      labels: sessionHistory.map((h) =>
        new Date(h.date).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Confidence",
          data: sessionHistory.map((h) => h.average_confidence_score || 0),
          borderColor: "rgba(129, 140, 248, 1)",
          backgroundColor: "rgba(129, 140, 248, 0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [sessionHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            Interview Performance & Career Overview
          </h2>
          <p className="text-xs text-slate-400">
            Track your verbal interview metrics, speech confidence, and resume role readiness.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {stats?.total_interviews || 0} sessions analyzed in real-time
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Interviews"
              value={stats?.total_interviews || 0}
              subtitle="Completed HR & technical practice sessions"
              icon={Mic2}
              tone="indigo"
            />
            <StatCard
              label="Avg Confidence"
              value={`${stats?.average_confidence_score?.toFixed(1) || "0.0"}/10`}
              subtitle="Based on recent interview performance"
              icon={Activity}
              tone="emerald"
            />
            <StatCard
              label="Total Filler Words"
              value={stats?.total_filler_words || 0}
              subtitle="Across all recorded interview attempts"
              icon={TrendingUp}
              tone="rose"
            />
            <StatCard
              label="Improvement"
              value={`${improvementPercent.toFixed(1)}%`}
              subtitle="Change in confidence from first to latest session"
              icon={ArrowUpRight}
              tone="emerald"
            />
          </>
        )}
      </div>

      {/* ─── Resume Role Analyzer Callout Banner ──────────────────────────────── */}
      <GlassCard className="p-5 border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-medium">
              <Sparkles className="h-3 w-3" />
              New Feature: Role-Specific Resume Intelligence
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Benchmark Your Resume for Web Development, SDE, AI & More
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload your resume and select your target job role. Our AI analyzes your technical skills, reveals missing critical frameworks, rewrites bullet points into high-impact STAR statements, and suggests 3 tailored portfolio projects to bridge your gaps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {resumeData?.analysis ? (
              <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Latest Match ({resumeData.analysis.role})
                </div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {resumeData.analysis.overall_score || resumeData.analysis.role_match_score}% Match Score
                </div>
              </div>
            ) : null}

            <PrimaryButton
              type="button"
              className="gap-2 px-5 py-2.5 whitespace-nowrap"
              onClick={() => navigate("/resume-analyzer")}
            >
              <FileSearch className="h-4 w-4" />
              <span>{resumeData?.analysis ? "View Resume Analysis" : "Analyze Resume Now"}</span>
              <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart */}
        <GlassCard className="p-4 xl:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Confidence vs Date
              </div>
              <div className="text-sm text-slate-200">
                Visualize your speaking improvement
              </div>
            </div>
          </div>
          <div className="h-60">
            {loading ? (
              <Skeleton className="h-full" />
            ) : chartData ? (
              <Line
                data={chartData}
                options={{
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      ticks: { color: "#9CA3AF", font: { size: 10 } },
                      grid: { color: "rgba(55,65,81,0.4)" },
                    },
                    y: {
                      min: 0,
                      max: 10,
                      ticks: { color: "#9CA3AF", font: { size: 10 } },
                      grid: { color: "rgba(55,65,81,0.4)" },
                    },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Complete a few interview sessions to see your confidence graph
                here.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Recent history */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Recent Sessions
              </div>
              <div className="text-sm text-slate-200">
                Last {Math.min(sessionHistory.length, 5)} interviews
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </>
            ) : sessionHistory.length ? (
              [...sessionHistory]
                .slice(-5)
                .reverse()
                .map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-100">
                        {h.mode} • {h.difficulty}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(h.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-indigo-300">
                        {h.average_confidence_score?.toFixed(1)}/10
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {h.total_filler_words} filler words
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-xs text-slate-400">
                No interview sessions recorded yet. Start with an HR or
                Technical interview to see your history here.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardPage;
