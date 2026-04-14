"use client";

import React, { useState, useEffect } from "react";
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from "@/components/ui/card";
import { sanitizeImageUrl } from "@/lib/utils";
import { useTranslations } from 'next-intl';
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
  AlertTriangle,
  Bug,
  Eye,
  Key,
  Server,
  Database,
  Globe,
  Wifi,
  Terminal,
  FileCode,
  GitBranch,
  Cloud,
  Cpu,
  HardDrive,
  Loader2,
} from "lucide-react";

// Icon map for dynamic icon rendering
const ICON_MAP = {
  Shield,
  Code,
  Zap,
  Lock,
  AlertTriangle,
  Bug,
  Eye,
  Key,
  Server,
  Database,
  Globe,
  Wifi,
  Terminal,
  FileCode,
  GitBranch,
  Cloud,
  Cpu,
  HardDrive,
};

const POSTS_PER_PAGE = 4;

const BlogCard = ({ post }) => {
  const t = useTranslations('blogSection');
  const Icon = ICON_MAP[post.iconName] || Shield;

  return (
    <div className="h-full w-full max-w-sm">
      <Card className="h-full pt-0 overflow-hidden group bg-card dark:bg-card/50 backdrop-blur-sm border-border/50 dark:border-accent/15 hover:shadow-xl hover:shadow-accent/10 dark:hover:shadow-accent/15 transition-all duration-300 hover:border-accent/30 dark:hover:border-accent/40">
        <CardContent className="px-0 pt-0">
          <div className="relative overflow-hidden aspect-video rounded-t-xl">
            {/* Background - either gradient or cover image */}
            {post.coverType === "image" && post.coverImage ? (
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${sanitizeImageUrl(post.coverImage)})` }}
              />
            ) : (
              <motion.div
                className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary via-accent/50 to-primary/80"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 8,
                  ease: 'easeInOut',
                  repeat: Infinity
                }}
              />
            )}

            {/* Noise overlay */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="p-5 rounded-full bg-accent/15 backdrop-blur-sm group-hover:scale-110 group-hover:bg-muted/25 transition-all duration-300">
                <Icon
                  className="w-10 h-10 text-accent-foreground"
                />
              </div>
            </div>

            {/* Category Badge */}
            <Badge
              className="absolute top-3 left-3 z-10 bg-primary/70 text-primary-foreground border-0 backdrop-blur-sm text-xs"
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
          <CardTitle className="text-lg leading-tight text-card-foreground group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-2 text-muted-foreground">
            {post.excerpt}
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-3 pt-2 bg-card dark:bg-transparent">
          <Button
            asChild
            className="flex-1 bg-accent hover:bg-muted/90 text-accent-foreground"
          >
            <Link href={`/blog/${post.slug}`}>
              {t('readArticle')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const PaginationDots = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="h-9 w-9 rounded-full hover:bg-muted/10 text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index)}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            currentPage === index
              ? "bg-accent w-8"
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
        className="h-9 w-9 rounded-full hover:bg-muted/10 text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Empty state component
const EmptyState = () => {
  const t = useTranslations('blogSection');
  return (
  <div className="text-center py-16">
    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
    <h3 className="text-xl font-semibold text-foreground mb-2">{t('noArticles')}</h3>
    <p className="text-muted-foreground max-w-md mx-auto">
      {t('noArticlesDescription')}
    </p>
  </div>
);};

// Loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
  </div>
);

export function BlogSection() {
  const t = useTranslations('blogSection');
  const [currentPage, setCurrentPage] = useState(0);
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch published articles from database
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles/published?limit=9");
        if (response.ok) {
          const data = await response.json();
          setBlogPosts(data.articles || []);
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

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

  // Don't render section if no articles and not loading
  if (!isLoading && blogPosts.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('heading')}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </motion.div>
        
        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Blog Grid */}
        {!isLoading && blogPosts.length > 0 && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap justify-center gap-6 lg:gap-8"
              >
                {currentPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            <PaginationDots
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* View All Link */}
        {!isLoading && blogPosts.length > 0 && (
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
              className="rounded-full font-medium border-accent/30 hover:bg-muted/10 hover:text-accent hover:border-accent/50 text-foreground px-8"
            >
              <Link href="/blog" className="flex items-center gap-2">
                {t('viewAllArticles')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default BlogSection;
