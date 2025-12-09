import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Reveal({ children, className, delay = 0, direction = "up" as "up" | "left" | "right" }: { children: React.ReactNode; className?: string; delay?: number; direction?: "up" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(() => setActive(true), delay);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn("reveal", active && "reveal-active", direction === "left" && "reveal-left", direction === "right" && "reveal-right", className)}>{children}</div>
  );
}
