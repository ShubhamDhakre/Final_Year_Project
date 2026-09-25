import React from "react";
import { motion } from "framer-motion";

const ProgressBar = ({ value, max = 10 }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden border border-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="h-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-500"
      />
    </div>
  );
};

export default ProgressBar;

