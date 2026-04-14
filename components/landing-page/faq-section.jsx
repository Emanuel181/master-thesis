"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
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

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

export function FAQSection() {
  const t = useTranslations('faq');
  const [isOpen, setIsOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("idle");
  const [formData, setFormData] = useState({ email: "", question: "" });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-12">
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
            {t('heading')}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isMounted && (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {FAQ_KEYS.map((key, index) => {
                const itemId = `item-${index}`;
                return (
                  <AccordionItem
                    key={itemId}
                    value={itemId}
                    className="border border-border/60 rounded-xl px-6 bg-muted/40 backdrop-blur-sm data-[state=open]:bg-muted/60 data-[state=open]:border-accent/30 transition-all duration-200"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 [&[data-state=open]]:text-accent">
                      {t(`items.${key}.question`)}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {t(`items.${key}.answer`)}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
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
            {t('stillHaveQuestions')}
          </p>
          {isMounted && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-accent hover:text-accent/80 font-medium"
              >
                {t('askThemHere')}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{t('askDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('askDialog.description')}
                </DialogDescription>
              </DialogHeader>
              
              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{t('askDialog.successTitle')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('askDialog.successDescription')}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {t('askDialog.emailLabel')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder={t('askDialog.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={formStatus === "loading"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-question" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      {t('askDialog.questionLabel')} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="contact-question"
                      placeholder={t('askDialog.questionPlaceholder')}
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
                        {t('askDialog.sendingButton')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('askDialog.sendButton')}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
          )}
          {!isMounted && (
            <button
              type="button"
              className="text-accent hover:text-accent/80 font-medium"
            >
              {t('askThemHere')}
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default FAQSection;
