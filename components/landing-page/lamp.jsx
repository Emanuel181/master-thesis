"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LampDemo() {
  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-accent)] py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl">
        Build lamps <br /> the right way
      </motion.h1>
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-[var(--brand-dark)] w-full max-w-[100vw] z-0",
        className
      )}>
      <div
        className="relative flex w-full max-w-[100vw] flex-1 items-center justify-center isolate z-0 overflow-hidden">
        {/* Left conic gradient */}
        <motion.div
          initial={{ opacity: 0.5, width: "5rem" }}
          whileInView={{ opacity: 1, width: "8rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto h-20 sm:h-40 md:h-56 w-[8rem] sm:w-[20rem] md:w-[30rem] -translate-y-1/2 -translate-x-1/2 bg-gradient-conic from-[var(--brand-accent)] via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]">
          <div
            className="absolute w-full left-0 bg-[var(--brand-dark)] h-12 sm:h-32 md:h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div
            className="absolute w-12 sm:w-32 md:w-40 h-full left-0 bg-[var(--brand-dark)] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        {/* Right conic gradient */}
        <motion.div
          initial={{ opacity: 0.5, width: "5rem" }}
          whileInView={{ opacity: 1, width: "8rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto h-20 sm:h-40 md:h-56 w-[8rem] sm:w-[20rem] md:w-[30rem] -translate-y-1/2 translate-x-1/2 bg-gradient-conic from-transparent via-transparent to-[var(--brand-accent)] text-white [--conic-position:from_290deg_at_center_top]">
          <div
            className="absolute w-12 sm:w-32 md:w-40 h-full right-0 bg-[var(--brand-dark)] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div
            className="absolute w-full right-0 bg-[var(--brand-dark)] h-12 sm:h-32 md:h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        {/* Blur backgrounds */}
        <div
          className="absolute top-1/2 h-16 sm:h-36 md:h-48 w-full translate-y-12 bg-[var(--brand-dark)] blur-2xl"></div>
        <div
          className="absolute top-1/2 z-50 h-16 sm:h-36 md:h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        {/* Glow effects */}
        <div
          className="absolute inset-auto z-50 h-10 sm:h-28 md:h-36 w-[6rem] sm:w-[18rem] md:w-[28rem] -translate-y-1/2 rounded-full bg-[var(--brand-accent)] opacity-50 blur-3xl"></div>
        <motion.div
          initial={{ width: "2rem" }}
          whileInView={{ width: "4rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-10 sm:h-28 md:h-36 w-16 sm:w-48 md:w-64 -translate-y-[2.5rem] sm:-translate-y-[5rem] md:-translate-y-[6rem] rounded-full bg-[var(--brand-accent)]/80 blur-2xl"></motion.div>
        {/* Blue line */}
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[16rem] sm:w-[28rem] md:w-[40rem] -translate-y-[3rem] sm:-translate-y-[6rem] md:-translate-y-[7rem] bg-[var(--brand-accent)]"></motion.div>
        {/* Dark overlay above lamp */}
        <div
          className="absolute inset-auto z-40 h-16 sm:h-36 md:h-44 w-full -translate-y-[5rem] sm:-translate-y-[10rem] md:-translate-y-[12.5rem] bg-[var(--brand-dark)]"></div>
      </div>
      <div className="relative z-50 flex -translate-y-20 sm:-translate-y-52 md:-translate-y-72 flex-col items-center px-4 sm:px-5 w-full max-w-[100vw]">
        {children}
      </div>
    </div>
  );
};
