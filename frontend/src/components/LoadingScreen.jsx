import React from "react";
import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-glass flex items-center gap-3"
      >
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
          AI
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-50">
            Preparing your workspace
          </span>
          <span className="text-xs text-slate-400">
            Loading your interview dashboard...
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;

