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
        quote: "Universities are a strong fit for VulnIQ because it bridges theory and real-world security practice. By importing student or faculty code, universities can teach practical remediation while actively improving campus web security. The 4-agent workflow mirrors professional security teams: Reviewer analyzes vulnerabilities, Implementation applies fixes based on course-specific knowledge bases, Tester validates results, and Report documents outcomes. Specialized prompts keep learning aligned with curriculum goals, while RAG ensures fixes are accurate and grounded in approved security protocols.",
        name: "Universities",
    },
    {
        quote: "Startups benefit from VulnIQ because it delivers expert-level security without the cost of a dedicated security team. Teams can import their codebase and immediately run the 4-agent workflow, where vulnerabilities are identified, fixed, tested, and documented automatically. Knowledge bases ensure fixes follow the company’s standards, and RAG prevents hallucinated solutions. This allows startups to move fast while maintaining strong security with minimal overhead.",
        name: "Startups",
    },
    {
        quote: "People learning about web security gain practical, hands-on insight with VulnIQ by observing how real vulnerabilities are handled step by step. The Reviewer explains what is wrong and why it matters, the Implementation agent applies protocol-driven fixes, the Tester verifies correctness, and the Report agent clearly explains each decision. Guided prompts support structured learning, while RAG ensures all explanations and fixes remain accurate and grounded in real security standards.",
        name: "People Learning About Web Security",
    },
    {
        quote: "Enterprise developer teams choose VulnIQ because it scales security processes across large and complex codebases. Teams can define specialized prompts and maintain extensive knowledge bases for internal and industry standards. The 4-agent system consistently analyzes, fixes, tests, and documents vulnerabilities, while RAG ensures every remediation is traceable and compliant. This enables reliable, repeatable security at enterprise scale without sacrificing accuracy.",
        name: "Enterprise Developer Teams",
    },
    {
        quote: "Open source contributors benefit from VulnIQ because it supports transparent, community-driven security improvements. Contributors can import repositories, rely on shared knowledge bases for accepted security standards, and use the agent workflow to collaboratively identify, fix, test, and document vulnerabilities. RAG ensures all recommendations stay aligned with established best practices, making security improvements trustworthy and easy to review.",
        name: "Open Source Contributors",
    },
];

