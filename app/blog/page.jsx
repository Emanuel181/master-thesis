"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SearchIcon, ArrowRightIcon, CalendarDaysIcon, Clock } from "lucide-react";

import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { blogPosts, getIconComponent } from "@/lib/blog-data";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

// Blog Grid Component
function BlogGrid({ posts }) {
  const router = useRouter();
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => {
        const Icon = getIconComponent(post.iconName);
        
        return (
          <motion.div
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card 
              className="group h-full overflow-hidden shadow-none border-border/50 dark:border-[rgba(var(--brand-accent-rgb),0.15)] bg-card/80 dark:bg-card/50 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(var(--brand-accent-rgb),0.1)] hover:border-[rgba(var(--brand-accent-rgb),0.3)] transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/blog/${post.slug}`)}
            >
              <CardContent className="space-y-3.5 p-0">
                {/* Gradient Image Area */}
                <div className="mb-6 overflow-hidden rounded-t-lg sm:mb-8">
                  <div 
                    className="h-48 w-full relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: post.gradient || `linear-gradient(135deg, 
                        rgba(var(--brand-accent-rgb), 0.2) 0%, 
                        rgba(var(--brand-primary-rgb), 0.4) 50%,
                        rgba(var(--brand-accent-rgb), 0.2) 100%)`,
                      backgroundSize: "400% 400%",
                      animation: "gradientMove 8s ease infinite",
                    }}
                  >
                    {/* Icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 rounded-2xl bg-background/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    
                    {/* Featured badge */}
                    {post.featured && (
                      <Badge className="absolute top-3 right-3 bg-[var(--brand-accent)] text-[var(--brand-primary)] shadow-lg">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="px-5 pb-5 space-y-3.5">
                  {/* Date and Category */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <CalendarDaysIcon className="size-4" />
                      <span>{post.date}</span>
                    </div>
                    <Badge className="bg-[rgba(var(--brand-accent-rgb),0.1)] text-[var(--brand-accent)] rounded-full border-0 text-xs hover:bg-[rgba(var(--brand-accent-rgb),0.2)]">
                      {post.category}
                    </Badge>
                  </div>
                  
                  {/* Title */}
                  <h3 className="line-clamp-2 text-lg font-medium md:text-xl text-foreground group-hover:text-[var(--brand-accent)] transition-colors">
                    {post.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {post.excerpt}
                  </p>
                  
                  {/* Author and Read More */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-foreground">{post.author}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="group-hover:bg-[var(--brand-accent)] group-hover:text-white group-hover:border-[var(--brand-accent)] hover:border-[var(--brand-accent)] hover:bg-[var(--brand-accent)] hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/blog/${post.slug}`);
                      }}
                    >
                      <ArrowRightIcon className="size-4 -rotate-45" />
                      <span className="sr-only">Read more: {post.title}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// Main Blog Page
export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef(null);
  
  // Restore scroll position when returning to this page
  useScrollRestoration(scrollRef);
  
  // Get unique categories from blog posts
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(blogPosts.map(post => post.category))];
    return cats;
  }, []);
  
  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return blogPosts;
    const query = searchQuery.toLowerCase();
    return blogPosts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);
  
  // Get posts by category
  const getPostsByCategory = (category) => {
    if (category === "All") return filteredPosts;
    return filteredPosts.filter(post => post.category === category);
  };

  return (
    <ScrollArea className="h-screen" viewportRef={scrollRef}>
      <FloatingNavbar />
      
      {/* Landing page background patterns */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />
      
      {/* Gradient animation keyframes */}
      <style jsx global>{`
        @keyframes gradientMove {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      
      <main className="min-h-screen bg-transparent relative z-10">
        <section className="py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-12 lg:px-8">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <p className="text-sm text-[var(--brand-accent)] font-medium">Blog</p>

              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl">
                Stay informed with the latest trends, best practices,
                in code security and vulnerability management.
              </p>
            </motion.div>

            {/* Tabs and Search */}
            <Tabs defaultValue="All" className="space-y-8 lg:space-y-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"
              >
                {/* Category Tabs */}
                <TabsList className="h-auto p-0 bg-transparent gap-2 flex-wrap">
                  {categories.map(category => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="px-4 py-2 text-sm font-medium rounded-full border border-border/50 bg-transparent text-muted-foreground shadow-none transition-all duration-200 hover:text-foreground hover:border-[rgba(var(--brand-accent-rgb),0.4)] data-[state=active]:bg-[rgba(var(--brand-accent-rgb),0.1)] data-[state=active]:text-[var(--brand-accent)] data-[state=active]:border-[var(--brand-accent)]"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Search Input */}
                <div className="relative w-full md:w-72">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-10 pr-4 w-full rounded-full bg-muted/30 dark:bg-[rgba(var(--brand-accent-rgb),0.05)] border-border/50 text-foreground placeholder:text-muted-foreground focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-all [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
                  />
                </div>
              </motion.div>

              {/* All Posts Tab */}
              <TabsContent value="All" className="mt-8">
                <BlogGrid posts={getPostsByCategory("All")} />
              </TabsContent>

              {/* Category-specific Tabs */}
              {categories.slice(1).map((category) => (
                <TabsContent key={category} value={category} className="mt-8">
                  <BlogGrid posts={getPostsByCategory(category)} />
                </TabsContent>
              ))}
            </Tabs>
            
            {/* No Results */}
            {filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">No articles found matching "{searchQuery}"</p>
                <Button 
                  variant="ghost" 
                  className="mt-4 text-[var(--brand-accent)]"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </ScrollArea>
  );
}
