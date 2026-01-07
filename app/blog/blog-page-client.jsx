"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SearchIcon, ArrowRightIcon, CalendarDaysIcon, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIconComponent } from "@/lib/blog-data";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { FeaturedPostSidebarItem } from "@/components/blog/featured-post-sidebar-item";

const POSTS_PER_PAGE = 6;

// Featured Hero Section with main post and sidebar
function FeaturedSection({ posts }) {
  const router = useRouter();

  // Get featured post (first one marked as featured, or first post)
  const featuredPost = posts.find(p => p.featured) || posts[0];
  // Get other posts for sidebar (those marked for "More Articles", excluding the main featured)
  const sidebarPosts = posts
    .filter(p => p.id !== featuredPost?.id && p.showInMoreArticles !== false)
    .slice(0, 5);

  if (!featuredPost) return null;

  const Icon = getIconComponent(featuredPost.iconName);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-12">
      {/* Main Featured Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-[350px] sm:h-[400px] md:h-[450px] overflow-hidden rounded-xl shadow-lg lg:col-span-2 cursor-pointer group"
        onClick={() => router.push(`/blog/${featuredPost.slug}`)}
      >
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
          style={{
            background: featuredPost.gradient || `linear-gradient(135deg, 
              rgba(var(--brand-accent-rgb), 0.3) 0%, 
              rgba(var(--brand-primary-rgb), 0.5) 50%,
              rgba(var(--brand-accent-rgb), 0.3) 100%)`,
            backgroundSize: "400% 400%",
            animation: "gradientMove 8s ease infinite",
          }}
        />

        {/* Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Icon className="w-48 h-48 text-white" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8 text-white">
          <Badge className="mb-3 w-fit bg-[var(--brand-accent)] text-white border-0">
            {featuredPost.category}
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl leading-tight font-bold mb-3 group-hover:text-[var(--brand-accent)] transition-colors">
            {featuredPost.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl">
            {featuredPost.excerpt}
          </p>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span className="font-medium text-white">{featuredPost.author}</span>
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="w-4 h-4" />
              {featuredPost.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {featuredPost.readTime}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Other Featured Posts Sidebar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card text-card-foreground space-y-5 rounded-xl border border-border/50 p-5 lg:col-span-1"
      >
        <h3 className="text-lg font-semibold">More articles</h3>
        <div className="space-y-4">
          {sidebarPosts.map((post) => {
            const PostIcon = getIconComponent(post.iconName);
            return (
              <FeaturedPostSidebarItem
                key={post.id}
                imageSrc={null}
                imageAlt={post.title}
                title={post.title}
                href={`/blog/${post.slug}`}
                category={post.category}
                icon={<PostIcon className="w-6 h-6 text-[var(--brand-accent)]" />}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// Blog Grid Component - always renders exactly 3 grid items to maintain consistent layout
function BlogGrid({ posts }) {
  const router = useRouter();

  // Calculate empty placeholders needed to always have 3 items
  const emptyCount = POSTS_PER_PAGE - posts.length;

  return (
    // Grid with fixed row structure ensures consistent height regardless of post count
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Render actual posts */}
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

      {/* Empty placeholder cards to maintain consistent grid height */}
      {emptyCount > 0 && Array.from({ length: emptyCount }).map((_, i) => (
        <div
          key={`placeholder-${i}`}
          className="invisible"
          aria-hidden="true"
        >
          <Card className="h-full overflow-hidden">
            <CardContent className="space-y-3.5 p-0">
              <div className="mb-6 overflow-hidden rounded-t-lg sm:mb-8">
                <div className="h-48 w-full" />
              </div>
              <div className="px-5 pb-5 space-y-3.5">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <CalendarDaysIcon className="size-4" />
                    <span>Placeholder</span>
                  </div>
                  <Badge className="rounded-full border-0 text-xs">Category</Badge>
                </div>
                <h3 className="line-clamp-2 text-lg font-medium md:text-xl">Placeholder Title Goes Here</h3>
                <p className="text-muted-foreground line-clamp-2 text-sm">Placeholder excerpt text for consistent height.</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">Author</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      5 min
                    </span>
                  </div>
                  <Button size="icon" variant="outline">
                    <ArrowRightIcon className="size-4 -rotate-45" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

// Pagination Controls Component
function PaginationControls({ posts, currentPage, setCurrentPage, postsPerPage }) {
  const totalPages = Math.ceil(posts.length / postsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/30">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="rounded-full px-4 gap-1 border-border/50 hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Button
            key={i}
            variant={currentPage === i + 1 ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentPage(i + 1)}
            className={`w-8 h-8 rounded-full p-0 ${
              currentPage === i + 1 
                ? 'bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90' 
                : 'hover:bg-muted'
            }`}
          >
            {i + 1}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="rounded-full px-4 gap-1 border-border/50 hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] disabled:opacity-50"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Main Blog Page Client Component
export default function BlogPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);
  
  // Restore scroll position when returning to this page
  useScrollRestoration(scrollRef);
  
  // Fetch published articles from database
  useEffect(() => {
    const fetchPublishedArticles = async () => {
      try {
        const response = await fetch("/api/articles/published");
        if (response.ok) {
          const data = await response.json();
          setPublishedArticles(data.articles || []);
        }
      } catch (error) {
        console.error("Error fetching published articles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublishedArticles();
  }, []);

  // Blog posts are now only from the database
  const blogPosts = useMemo(() => {
    return publishedArticles;
  }, [publishedArticles]);

  // Get unique categories from blog posts
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(blogPosts.map(post => post.category))];
    return cats;
  }, [blogPosts]);

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return blogPosts;
    const query = searchQuery.toLowerCase();
    return blogPosts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query)
    );
  }, [searchQuery, blogPosts]);

  // Get posts by category
  const getPostsByCategory = (category) => {
    if (category === "All") return filteredPosts;
    return filteredPosts.filter(post => post.category === category);
  };

  // Pagination logic
  const getPaginatedPosts = (posts) => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return posts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  };

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

            {/* Featured Section - Only show when not searching */}
            {!searchQuery && (
              <FeaturedSection posts={blogPosts} />
            )}

            {/* Recent Posts Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  {searchQuery ? "Search Results" : "All Posts"}
                </h2>
              </div>

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
                <BlogGrid posts={getPaginatedPosts(getPostsByCategory("All"))} />
                <PaginationControls
                  posts={getPostsByCategory("All")}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  postsPerPage={POSTS_PER_PAGE}
                />
              </TabsContent>

              {/* Category-specific Tabs */}
              {categories.slice(1).map((category) => (
                <TabsContent key={category} value={category} className="mt-8">
                  <BlogGrid posts={getPaginatedPosts(getPostsByCategory(category))} />
                  <PaginationControls
                    posts={getPostsByCategory(category)}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    postsPerPage={POSTS_PER_PAGE}
                  />
                </TabsContent>
              ))}
            </Tabs>
            </div>

            {/* No Results */}
            {filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">No articles found matching &ldquo;{searchQuery}&rdquo;</p>
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
