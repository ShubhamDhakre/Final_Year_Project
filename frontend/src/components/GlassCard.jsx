import React from "react";
import { motion } from "framer-motion";

const GlassCard = ({
  children,
  className = "",
  hoverable = true,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        hoverable
          ? {
              y: -5,
              scale: 1.015,
              transition: {
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.5,
              },
            }
          : undefined
      }
      whileTap={
        hoverable
          ? {
              scale: 0.99,
              transition: { duration: 0.12 },
            }
          : undefined
      }
      className={`relative rounded-2xl bg-slate-900/40 bg-gradient-to-b from-white/[0.09] via-white/[0.03] to-white/[0.01] border border-white/[0.14] backdrop-blur-2xl backdrop-saturate-150 shadow-floating ${
        hoverable
          ? "hover:shadow-floating-hover hover:border-white/35 hover:bg-white/[0.06] hover:z-20 cursor-pointer transition-colors duration-200"
          : "transition-shadow duration-300"
      } ${className}`}
      {...props}
    >
      {/* Specular glass reflection beam on top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-2xl" />
      {children}
    </motion.div>
  );
};

export default GlassCard;
