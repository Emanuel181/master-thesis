"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Code,
  Zap,
  Lock,
  AlertTriangle
} from "lucide-react";

const blogPosts = [
  {
    id: 1,
    slug: "understanding-sql-injection-prevention",
    title: "Understanding SQL injection: detection and prevention",
    excerpt: "SQL injection remains one of the most dangerous vulnerabilities in web applications. Learn how attackers exploit database queries and discover proven strategies to protect your applications.",
    category: "Vulnerability Analysis",
    date: "December 28, 2024",
    readTime: "12 min read",
    icon: AlertTriangle,
    gradient: "linear-gradient(45deg, hsl(220,60%,10%), hsl(0,70%,35%), hsl(20,80%,30%), hsl(350,60%,35%), hsl(10,70%,20%))",
    featured: true,
  },
  {
    id: 2,
    slug: "modern-application-security-testing-strategies",
    title: "Modern application security testing: SAST and DAST strategy",
    excerpt: "Discover how to combine static and dynamic security testing methodologies to create a robust application security program and integrate testing into your CI/CD pipeline.",
    category: "Security Testing",
    date: "December 25, 2024",
    readTime: "15 min read",
    icon: Shield,
    gradient: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,70%,25%), hsl(200,80%,30%), hsl(170,60%,35%), hsl(190,70%,20%))",
    featured: false,
  },
  {
    id: 3,
    slug: "cross-site-scripting-defense-guide",
    title: "Cross-site scripting defense: protecting your web apps",
    excerpt: "Cross-site scripting vulnerabilities allow attackers to inject malicious scripts into trusted websites. Learn the different types of XSS attacks and implement effective defenses.",
    category: "Web Security",
    date: "December 22, 2024",
    readTime: "14 min read",
    icon: Code,
    gradient: "linear-gradient(45deg, hsl(220,60%,10%), hsl(270,70%,35%), hsl(290,80%,30%), hsl(260,60%,40%), hsl(280,70%,25%))",
    featured: false,
  },
  {
    id: 4,
    slug: "secure-api-development-best-practices",
    title: "Secure API development: building resilient APIs",
    excerpt: "APIs are the backbone of modern applications but also prime targets for attackers. Learn essential security practices for authentication, authorization, and input validation.",
    category: "API Security",
    date: "December 19, 2024",
    readTime: "16 min read",
    icon: Zap,
    gradient: "linear-gradient(45deg, hsl(220,60%,10%), hsl(40,70%,35%), hsl(30,80%,40%), hsl(50,60%,35%), hsl(45,70%,25%))",
    featured: false,
  },
  {
    id: 5,
    slug: "secrets-management-secure-development",
    title: "Secrets management: protecting API keys and credentials",
    excerpt: "Hard-coded secrets in source code are a leading cause of security breaches. Learn how to properly manage API keys, database credentials, and other sensitive configuration data.",
    category: "DevSecOps",
    date: "December 15, 2024",
    readTime: "13 min read",
    icon: Lock,
    gradient: "linear-gradient(45deg, hsl(220,60%,10%), hsl(140,70%,25%), hsl(160,80%,30%), hsl(130,60%,35%), hsl(150,70%,20%))",
    featured: false,
  }
];

const POSTS_PER_PAGE = 3;

const BlogCard = ({ post, index }) => {
  const Icon = post.icon;
  
  return (
    <div className="h-full">
      <Card className="h-full pt-0 overflow-hidden group bg-card dark:bg-card/50 backdrop-blur-sm border-border/50 dark:border-[rgba(var(--brand-accent-rgb),0.15)] hover:shadow-xl hover:shadow-[rgba(var(--brand-accent-rgb),0.1)] dark:hover:shadow-[rgba(var(--brand-accent-rgb),0.15)] transition-all duration-300 hover:border-[rgba(var(--brand-accent-rgb),0.3)] dark:hover:border-[rgba(var(--brand-accent-rgb),0.4)]">
        <CardContent className="px-0 pt-0">
          <div className="relative overflow-hidden aspect-video rounded-t-xl">
            {/* Animated Moving Gradient Background */}
            <motion.div
              className="absolute inset-0 w-full h-full bg-[length:400%_400%]"
              style={{
                backgroundColor: 'var(--brand-dark)',
                backgroundImage: post.gradient,
              }}
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
              }}
              transition={{ 
                duration: 8, 
                ease: 'easeInOut', 
                repeat: Infinity 
              }}
            />
            
            {/* Noise overlay */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="p-5 rounded-full bg-[rgba(var(--brand-accent-rgb),0.15)] backdrop-blur-sm group-hover:scale-110 group-hover:bg-[rgba(var(--brand-accent-rgb),0.25)] transition-all duration-300">
                <Icon className="w-10 h-10 text-[var(--brand-light)]" />
              </div>
            </div>
            
            {/* Category Badge */}
            <Badge 
              className="absolute top-3 left-3 z-10 bg-[rgba(var(--brand-primary-rgb),0.7)] text-[var(--brand-light)] border-0 backdrop-blur-sm text-xs"
            >
              {post.category}
            </Badge>
          </div>
        </CardContent>
        <CardHeader className="pb-2 bg-card dark:bg-transparent">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>
          <CardTitle className="text-lg leading-tight text-card-foreground group-hover:text-[var(--brand-accent)] transition-colors line-clamp-2">
            {post.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-2 text-muted-foreground">
            {post.excerpt}
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-3 pt-2 bg-card dark:bg-transparent">
          <Button 
            asChild
            className="flex-1 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-[var(--brand-primary)]"
          >
            <a href={`/blog/${post.slug}`}>
              Read Article
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const PaginationDots = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="h-9 w-9 rounded-full hover:bg-[rgba(var(--brand-accent-rgb),0.1)] text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index)}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            currentPage === index
              ? "bg-[var(--brand-accent)] w-8"
              : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
          }`}
          aria-label={`Go to page ${index + 1}`}
        />
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="h-9 w-9 rounded-full hover:bg-[rgba(var(--brand-accent-rgb),0.1)] text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function BlogSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);
  
  const currentPosts = blogPosts.slice(
    currentPage * POSTS_PER_PAGE,
    (currentPage + 1) * POSTS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Security knowledge hub
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Expert insights on application security, vulnerability detection, and secure development practices from the VulnIQ team.
          </p>
        </motion.div>
        
        {/* Blog Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`grid grid-cols-1 gap-6 lg:gap-8 ${
              currentPosts.length === 1 
                ? 'md:grid-cols-1 max-w-md mx-auto' 
                : currentPosts.length === 2 
                  ? 'md:grid-cols-2 max-w-3xl mx-auto' 
                  : 'md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {currentPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
        
        {/* Pagination */}
        <PaginationDots
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
        
        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full font-medium border-[rgba(var(--brand-accent-rgb),0.3)] hover:bg-[rgba(var(--brand-accent-rgb),0.1)] hover:border-[rgba(var(--brand-accent-rgb),0.5)] text-foreground px-8"
          >
            <a href="/blog" className="flex items-center gap-2">
              View all articles
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default BlogSection;
