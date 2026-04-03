"use client";

import React from "react";
import { motion } from "framer-motion";
import { Github, Search, Wrench, FileText } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Import your code",
    description:
      "Connect GitHub or GitLab. Select a repository and VulnIQ maps your codebase automatically.",
    icon: Github,
    color: "from-violet-500 to-indigo-600",
  },
  {
    number: "02",
    title: "AI reviews vulnerabilities",
    description:
      "The Reviewer agent scans your code against your knowledge base and security standards like CWE & OWASP.",
    icon: Search,
    color: "from-violet-500 to-purple-600",
  },
  {
    number: "03",
    title: "Agents remediate & test",
    description:
      "The Implementer applies fixes grounded in your docs. The Tester validates each patch passes security checks.",
    icon: Wrench,
    color: "from-emerald-500 to-green-600",
  },
  {
    number: "04",
    title: "Export verified report",
    description:
      "The Reporter compiles findings, patches, evidence, and test results into an audit-ready PDF report.",
    icon: FileText,
    color: "from-orange-500 to-rose-600",
  },
];

function StepCard({ step, index, total }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center text-center group"
    >
      {/* Connector line (hidden on last item) */}
      {index < total - 1 && (
        <div className="hidden md:block absolute top-10 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px">
          <div className="w-full h-full bg-gradient-to-r from-accent/30 to-accent/10" />
          {/* Animated dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 2.5, delay: index * 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Step number circle */}
      <div className="relative mb-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted/50 dark:bg-muted/60 border border-border flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-black/25 group-hover:border-primary/30 dark:group-hover:border-primary/20 transition-all duration-300">
          <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary/80" />
        </div>
        {/* Step number badge */}
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background dark:bg-card border-2 border-border dark:border-primary/25 flex items-center justify-center">
          <span className="text-xs font-bold text-accent">{step.number}</span>
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
        {step.title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[240px]">
        {step.description}
      </p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-12 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3 font-medium">
            Simple and powerful
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            How <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">VulnIQ</span> works
          </h2>
          <div className="h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent w-16 sm:w-20 md:w-24 mx-auto mt-5 sm:mt-6" />
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6 md:gap-4 lg:gap-8">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} total={steps.length} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;

