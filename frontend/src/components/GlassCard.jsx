import React from "react";
import { motion } from "framer-motion";

const GlassCard = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-glow ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

