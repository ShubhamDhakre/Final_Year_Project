import React from "react";
import { motion } from "framer-motion";

const PrimaryButton = ({
  children,
  className = "",
  as = "button",
  ...props
}) => {
  const Comp = motion[as] || motion.button;
  return (
    <Comp
      whileHover={{
        scale: 1.03,
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-medium text-white shadow-soft hover:shadow-realistic px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
};

export default PrimaryButton;
