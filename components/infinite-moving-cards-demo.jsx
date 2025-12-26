"use client";

import React, { useEffect, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export default function InfiniteMovingCardsDemo() {
  return (
    <div className="h-[40rem] rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden">
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="slow"
      />
    </div>
  );
}

const testimonials = [
  {
    quote: "Universities can leverage VulnIQ to teach practical security remediation and maintain university security, including keeping their websites secure. Import student code, create knowledge bases for course-specific security protocols, and let agents demonstrate real-world fixes through the 4-agent workflow: Reviewer for analysis, Implementation for patches, Tester for validation, and Report for documentation. Specialized prompts ensure curriculum alignment while RAG prevents hallucinations.",
    name: "Universities",
    title: "Educational Excellence",
  },
  {
    quote: "Startups benefit from VulnIQ's rapid security workflow. With limited resources, import your codebase and deploy the 4-agent system: Reviewer identifies vulnerabilities, Implementation applies fixes grounded in your knowledge bases, Tester verifies changes, and Report documents everything. Custom prompts and RAG ensure cost-effective, hallucination-free security without expert hires.",
    name: "Startups",
    title: "Agile Security Solutions",
  },
  {
    quote: "Students learning security get hands-on experience with VulnIQ's agent-based approach. Watch as the Reviewer agent analyzes code, Implementation applies protocol-driven fixes from knowledge bases, Tester validates results, and Report explains decisions. Specialized prompts guide learning while RAG ensures accurate, grounded remediation education.",
    name: "Students Learning Security",
    title: "Practical Learning Tools",
  },
  {
    quote: "Enterprise developer teams scale security with VulnIQ's comprehensive workflow. Import large codebases, define specialized prompts per agent, and maintain extensive knowledge bases for industry protocols. The 4-agent system (Reviewer, Implementation, Tester, Report) uses RAG to deliver hallucination-free fixes at enterprise scale.",
    name: "Enterprise Developer Teams",
    title: "Enterprise-Grade Security",
  },
  {
    quote: "Open source contributors enhance project security with VulnIQ's transparent workflow. Import repositories, create community knowledge bases for security standards, and let agents collaborate: Reviewer flags issues, Implementation suggests fixes, Tester ensures quality, and Report documents changes. RAG keeps all actions grounded in established protocols.",
    name: "Open Source Contributors",
    title: "Community-Driven Security",
  },
];
