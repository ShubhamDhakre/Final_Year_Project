import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CursorGlow = () => {
  const [visible, setVisible] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-400);
  const mouseY = useMotionValue(-400);

  // Responsive primary spring for cursor core
  const springX = useSpring(mouseX, { stiffness: 220, damping: 26, mass: 0.45 });
  const springY = useSpring(mouseY, { stiffness: 220, damping: 26, mass: 0.45 });

  // Slightly slower trailing spring for fluid liquid neon trailing
  const trailingX = useSpring(mouseX, { stiffness: 140, damping: 22, mass: 0.7 });
  const trailingY = useSpring(mouseY, { stiffness: 140, damping: 22, mass: 0.7 });

  useEffect(() => {
    // Only enable on fine pointer devices (mouse/trackpad)
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      if (!visible) setVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, visible]);

  return (
    <>
      {/* ─── Layer 1: Background Ambient Neon Bloom (Behind Glass Cards) ─── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Trailing electric cyan-violet neon aura (halved radius, soft visibility) */}
        <motion.div
          className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            x: trailingX,
            y: trailingY,
            opacity: visible ? 0.45 : 0,
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(168, 85, 247, 0.22) 40%, rgba(6, 182, 212, 0.12) 65%, transparent 80%)",
            filter: "blur(45px)",
            mixBlendMode: "screen",
            transition: "opacity 0.35s ease-out",
          }}
        />

        {/* Dynamic neon cyan/indigo core (halved radius, soft visibility) */}
        <motion.div
          className="absolute -top-[80px] -left-[80px] w-[160px] h-[160px] rounded-full pointer-events-none"
          style={{
            x: springX,
            y: springY,
            opacity: visible ? 0.55 : 0,
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.40) 0%, rgba(129, 140, 248, 0.28) 45%, rgba(192, 132, 252, 0.15) 75%, transparent 85%)",
            filter: "blur(24px)",
            mixBlendMode: "screen",
            transition: "opacity 0.35s ease-out",
          }}
        />
      </div>

      {/* ─── Layer 2: Surface Interactive Neon Spotlight (Over Cards & Elements) ─── */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {/* Soft neon surface sheen (halved radius, subtle visibility) */}
        <motion.div
          className="absolute -top-[70px] -left-[70px] w-[140px] h-[140px] rounded-full pointer-events-none"
          style={{
            x: springX,
            y: springY,
            opacity: visible ? 0.26 : 0,
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(168, 85, 247, 0.16) 50%, transparent 75%)",
            filter: "blur(18px)",
            mixBlendMode: "screen",
            transition: "opacity 0.35s ease-out",
          }}
        />

        {/* Precision neon spark center at pointer (halved radius, soft visibility) */}
        <motion.div
          className="absolute -top-[15px] -left-[15px] w-[30px] h-[30px] rounded-full pointer-events-none"
          style={{
            x: springX,
            y: springY,
            opacity: visible ? 0.22 : 0,
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(56, 189, 248, 0.25) 50%, transparent 80%)",
            filter: "blur(8px)",
            mixBlendMode: "screen",
            transition: "opacity 0.25s ease-out",
          }}
        />
      </div>
    </>
  );
};

export default CursorGlow;
