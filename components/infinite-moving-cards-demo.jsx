"use client";

import React, { useEffect, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export default function InfiniteMovingCardsDemo() {
  return (
    <div className="h-[25rem] sm:h-[40rem] rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden">
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
        quote:
            "Universities are a strong fit for VulnIQ. It connects theory with real security work. Students and faculty can import code and learn practical remediation. The four agent workflow reflects professional teams. The Reviewer finds vulnerabilities. The Implementation agent applies fixes using course knowledge bases. The Tester validates results. The Report agent documents outcomes. Specialized prompts keep learning aligned with curriculum goals. RAG keeps fixes accurate and grounded in approved security protocols.",
        name: "Universities",
    },
    {
        quote:
            "Startups benefit from VulnIQ. It delivers strong security without the cost of a dedicated security team. Teams import a codebase and run the four agent workflow. Vulnerabilities are identified. Fixes are applied. Tests confirm results. Reports document changes. Knowledge bases keep fixes aligned with company standards. RAG prevents hallucinated solutions. Startups move fast and keep strong security with low overhead.",
        name: "Startups",
    },
    {
        quote:
            "People learning web security gain hands on insight with VulnIQ. They see real vulnerabilities handled step by step. The Reviewer explains what is wrong and why it matters. The Implementation agent applies protocol driven fixes. The Tester verifies correctness. The Report agent explains each decision clearly. Guided prompts support structured learning. RAG keeps explanations and fixes accurate and grounded in real security standards.",
        name: "People Learning About Web Security",
    },
    {
        quote:
            "Enterprise developer teams choose VulnIQ. It scales security across large codebases. Teams define specialized prompts and maintain knowledge bases for internal and industry standards. The four agent system analyzes vulnerabilities. It applies fixes. It runs tests. It produces documentation. RAG keeps every remediation traceable and compliant. Teams get repeatable security at enterprise scale without losing accuracy.",
        name: "Enterprise Developer Teams",
    },
    {
        quote:
            "Open source contributors benefit from VulnIQ. It supports transparent and community driven security improvements. Contributors import repositories and rely on shared knowledge bases. The agent workflow identifies vulnerabilities. It applies fixes. It tests changes. It documents outcomes. RAG keeps recommendations aligned with established best practices. Security improvements become trustworthy and easy to review.",
        name: "Open Source Contributors",
    },
];


