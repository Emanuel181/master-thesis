"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Send, Loader2, CheckCircle2, Mail, User, Building2 } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Animated particle/branch component
const AnimatedBranches = ({ className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resize();
    window.addEventListener("resize", resize);

    // Branch/particle system
    const branches = [];
    const particles = [];
    const colors = ["#ffffff", "#1fb6cf", "#e6f4f7", "#ffffff"];

    class Branch {
      constructor(x, y, angle, length, generation = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
        this.generation = generation;
        this.progress = 0;
        this.speed = 0.02 + Math.random() * 0.02;
        this.children = [];
        this.hasSpawned = false;
        this.endColor = colors[Math.floor(Math.random() * colors.length)];
        this.endRadius = 2 + Math.random();
      }

      update() {
        if (this.progress < 1) {
          this.progress += this.speed;
        } else if (!this.hasSpawned && this.generation < 3) {
          this.hasSpawned = true;
          const numChildren = Math.random() > 0.5 ? 2 : 1;
          for (let i = 0; i < numChildren; i++) {
            const newAngle = this.angle + (Math.random() - 0.5) * 1.2;
            const newLength = this.length * (0.6 + Math.random() * 0.3);
            const endX = this.x + Math.cos(this.angle) * this.length;
            const endY = this.y + Math.sin(this.angle) * this.length;
            this.children.push(new Branch(endX, endY, newAngle, newLength, this.generation + 1));
          }
        }
        this.children.forEach(child => child.update());
      }

      draw(ctx) {
        const endX = this.x + Math.cos(this.angle) * this.length * this.progress;
        const endY = this.y + Math.sin(this.angle) * this.length * this.progress;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - this.generation * 0.06})`;
        ctx.lineWidth = Math.max(0.5, 2 - this.generation * 0.5);
        ctx.stroke();

        if (this.progress >= 1) {
          ctx.beginPath();
          ctx.arc(endX, endY, this.endRadius, 0, Math.PI * 2);
          ctx.fillStyle = this.endColor;
          ctx.fill();
        }

        this.children.forEach(child => child.draw(ctx));
      }
    }

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = 1.5 + Math.random() * 1.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.baseAlpha = 0.4 + Math.random() * 0.3;
        this.alpha = this.baseAlpha;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.01 + Math.random() * 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += this.pulseSpeed;
        this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.15;
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
      }
    }

    // Initialize branches from center points
    const initBranches = () => {
      branches.length = 0;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const topY = rect.height * 0.2;
      const bottomY = rect.height * 0.8;

      // Top branches going up
      for (let i = 0; i < 8; i++) {
        const x = centerX + (Math.random() - 0.5) * rect.width * 0.6;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        branches.push(new Branch(x, topY, angle, 30 + Math.random() * 50));
      }

      // Bottom branches going down
      for (let i = 0; i < 8; i++) {
        const x = centerX + (Math.random() - 0.5) * rect.width * 0.6;
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        branches.push(new Branch(x, bottomY, angle, 30 + Math.random() * 50));
      }

      // Floating particles
      particles.length = 0;
      for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
          Math.random() * rect.width,
          Math.random() * rect.height
        ));
      }
    };

    initBranches();

    let animationId;
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      branches.forEach(branch => {
        branch.update();
        branch.draw(ctx);
      });

      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
        
        // Wrap around
        if (particle.x < 0) particle.x = rect.width;
        if (particle.x > rect.width) particle.x = 0;
        if (particle.y < 0) particle.y = rect.height;
        if (particle.y > rect.height) particle.y = 0;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};

export function CTASection() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session;
  const [isOpen, setIsOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("idle"); // idle, loading, success, error
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("loading");
    
    // Simulate API call - replace with actual endpoint
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormStatus("success");
      setTimeout(() => {
        setIsOpen(false);
        setFormStatus("idle");
        setFormData({ name: "", email: "", company: "", message: "" });
      }, 2000);
    } catch {
      setFormStatus("error");
    }
  };

  return (
    <section className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex flex-col lg:flex-row items-stretch gap-0 rounded-3xl overflow-hidden">
          {/* Left side - Animated card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative flex-1 bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand-primary)] to-[var(--brand-accent)] p-8 sm:p-10 md:p-12 lg:p-16 min-h-[300px] lg:min-h-[400px] flex items-center justify-center overflow-hidden"
          >
            {/* Animated branches background */}
            <AnimatedBranches />

            {/* Decorative line */}
            <div className="absolute left-8 right-8 sm:left-10 sm:right-10 md:left-12 md:right-12 lg:left-16 lg:right-16 top-1/2 -translate-y-1/2 h-px bg-[var(--brand-accent)]/40" />

            {/* Title with underline */}
            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--brand-light)] tracking-tight">
                Get to know
              </h2>
              <div className="relative inline-block mt-2">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white italic">
                  VulnIQ
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-[var(--brand-accent)] origin-left"
                />
              </div>
            </div>
          </motion.div>

          {/* Right side - CTA content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex-1 bg-background p-8 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-center"
          >
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed mb-6 sm:mb-8">
              You can try VulnIQ right now - no account required.
              <span className="block mt-2 text-foreground font-medium">
                Experience AI-powered code security analysis instantly.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-lg font-semibold text-base bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white px-8"
                >
                  <a href="/dashboard" className="flex items-center justify-center gap-2">
                    Go to Dashboard
                    <LayoutDashboard className="w-4 h-4" />
                  </a>
                </Button>
              ) : (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="rounded-lg font-semibold text-base bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white px-8"
                    >
                      View demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Request a Demo</DialogTitle>
                      <DialogDescription>
                        Fill out the form below and we'll get back to you within 24 hours.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {formStatus === "success" ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground">Thank you!</p>
                          <p className="text-sm text-muted-foreground mt-1">We'll be in touch soon.</p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            Name
                          </Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            disabled={formStatus === "loading"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={formStatus === "loading"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="company" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            Company <span className="text-muted-foreground text-xs">(optional)</span>
                          </Label>
                          <Input
                            id="company"
                            placeholder="Your company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            disabled={formStatus === "loading"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="message">Message <span className="text-muted-foreground text-xs">(optional)</span></Label>
                          <Textarea
                            id="message"
                            placeholder="Tell us about your security needs..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={3}
                            disabled={formStatus === "loading"}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={formStatus === "loading"}
                        >
                          {formStatus === "loading" ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Request
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              )}
              
              {!isAuthenticated && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-lg font-medium text-base border-border hover:bg-muted"
                >
                  <a href="/about">
                    Learn More
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
