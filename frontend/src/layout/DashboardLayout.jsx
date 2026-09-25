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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-glow flex items-center justify-center font-bold">
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
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition 
                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-glow"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
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
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3 md:hidden">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-glow flex items-center justify-center font-bold">
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
