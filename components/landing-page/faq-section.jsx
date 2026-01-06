"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, CheckCircle2, Mail, MessageSquare } from "lucide-react";

const faqItems = [
  {
    question: "What is VulnIQ?",
    answer:
      "VulnIQ is an AI-powered code security platform that uses retrieval-augmented generation (RAG) to analyze your code for vulnerabilities. Unlike traditional scanners, it provides context-aware remediation suggestions without hallucinations by grounding its responses in verified security knowledge bases.",
  },
  {
    question: "How does VulnIQ differ from traditional security scanners?",
    answer:
      "Traditional scanners often produce high false-positive rates and generic recommendations. VulnIQ uses agentic AI to understand the context of your code, cross-references multiple security databases (CWE, OWASP, NVD), and generates specific, actionable remediation code tailored to your codebase.",
  },
  {
    question: "What programming languages are supported?",
    answer:
      "VulnIQ currently supports JavaScript, TypeScript, Python, Java, C#, Go, PHP, Ruby, and C/C++. We're continuously expanding language support based on user feedback and demand.",
  },
  {
    question: "Can I integrate VulnIQ with my CI/CD pipeline?",
    answer:
      "Yes! VulnIQ integrates seamlessly with GitHub and GitLab.",
  },
  {
    question: "What AI providers does VulnIQ support?",
    answer:
      "VulnIQ allows you to seamlessly switch between top-tier AI providers including OpenAI, Anthropic Claude, Google Gemini, AWS Bedrock, and Meta Llama. This flexibility lets you find the perfect balance of performance, cost, and compliance for your needs.",
  },
  {
    question: "Is there a free tier available?",
    answer:
      "Yes! VulnIQ is currently in open beta and completely free to use. We offer generous usage limits for individual developers and small teams. Enterprise plans with additional features and support will be available after the beta period.",
  },
  {
    question: "How accurate is VulnIQ's vulnerability detection?",
    answer:
      "Our RAG-based approach is designed to significantly reduce false positives compared to traditional scanners. By grounding responses in verified security knowledge bases like CWE, OWASP, and NVD, VulnIQ provides context-aware detection that improves accuracy and delivers actionable results.",
  },
];

export function FAQSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("idle");
  const [formData, setFormData] = useState({ email: "", question: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.question) return;
    
    setFormStatus("loading");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question",
          email: formData.email,
          message: formData.question,
        }),
      });
      
      if (response.ok) {
        setFormStatus("success");
        setTimeout(() => {
          setIsOpen(false);
          setFormStatus("idle");
          setFormData({ email: "", question: "" });
        }, 2000);
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  };

  return (
    <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Everything you need to know about VulnIQ and how it can help secure your code.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-6 bg-card/50 backdrop-blur-sm data-[state=open]:bg-card data-[state=open]:border-[var(--brand-accent)]/30 transition-all duration-200"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 [&[data-state=open]]:text-[var(--brand-accent)]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-[var(--brand-accent)] hover:text-[var(--brand-accent)]/80 font-medium"
              >
                Ask them here →
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Ask a Question</DialogTitle>
                <DialogDescription>
                  Send us your question and we'll get back to you as soon as possible.
                </DialogDescription>
              </DialogHeader>
              
              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Question sent!</p>
                    <p className="text-sm text-muted-foreground mt-1">We'll respond to your email soon.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={formStatus === "loading"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-question" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      Your Question <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="contact-question"
                      placeholder="What would you like to know?"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      rows={4}
                      required
                      disabled={formStatus === "loading"}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={formStatus === "loading" || !formData.email || !formData.question}
                  >
                    {formStatus === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Question
                      </>
                    )}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </section>
  );
}

export default FAQSection;
