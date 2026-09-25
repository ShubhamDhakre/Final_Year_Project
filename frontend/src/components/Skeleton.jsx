import React from "react";

const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-700/40 ${className}`}
    />
  );
};

export default Skeleton;

