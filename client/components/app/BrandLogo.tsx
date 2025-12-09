import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BrandLogo({ className }: { className?: string }) {
  const src =
    "https://cdn.builder.io/api/v1/image/assets%2Fdaf81e0a6f2c49548b7ed14d4b7cae10%2F617f9025ce4f4f6dbf094f254d101be7?format=webp&width=800";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.img
        src={src}
        alt="Sahayak logo"
        className="h-11 w-[131px] object-contain sm:h-8 sm:w-8"
        initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
      />
      <span className="sr-only">Sahayak</span>
    </div>
  );
}
