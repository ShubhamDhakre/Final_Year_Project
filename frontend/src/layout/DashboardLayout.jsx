import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageCircle,
  Mic,
  FileCode2,
  FileSearch,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Chatbot from "../components/Chatbot";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume-analyzer", label: "Resume Analyzer", icon: FileSearch },
  { to: "/hr-interview", label: "HR Interview", icon: Mic },
  { to: "/technical-interview", label: "Technical", icon: FileCode2 },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#070B14] text-slate-100 flex overflow-x-hidden">
      {/* ─── Floating Ambient Glow Spheres for Visible Glass Refraction ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-left Indigo glow */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-indigo-500/20 rounded-full blur-[140px]" />
        {/* Top-right Purple glow */}
        <div className="absolute top-10 -right-20 w-[500px] h-[500px] bg-purple-500/18 rounded-full blur-[130px]" />
        {/* Mid-screen Cyan/Blue accent glow */}
        <div className="absolute top-1/2 left-1/4 w-[450px] h-[450px] bg-blue-500/14 rounded-full blur-[150px]" />
        {/* Bottom Fuchsia/Violet glow */}
        <div className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/15 rounded-full blur-[150px]" />
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 hidden md:flex w-64 flex-col border-r border-white/10 bg-slate-950/50 backdrop-blur-2xl shadow-floating">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-soft flex items-center justify-center font-bold">
              AI
            </div>
            <div>
              <div className="font-semibold tracking-tight">
                AI Interview Coach
              </div>
              <div className="text-xs text-slate-400">
                Practice. Improve. Succeed.
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-soft"
                      : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div>
            <div className="font-medium text-slate-100 text-sm">
              {user?.name || "Guest"}
            </div>
            <div>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3 md:hidden">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-soft flex items-center justify-center font-bold">
              AI
            </div>
            <div>
              <div className="font-semibold text-sm">AI Interview Coach</div>
              <div className="text-[11px] text-slate-400">
                Interview practice dashboard
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Interview Analytics & Career Prep
            </span>
            <span className="font-semibold text-sm">
              Welcome back, {user?.name || "Candidate"}
            </span>
          </div>

          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-200 font-medium">
              Career Coach Ready
            </span>
          </motion.div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <Chatbot />
    </div>
  );
};

export default DashboardLayout;
