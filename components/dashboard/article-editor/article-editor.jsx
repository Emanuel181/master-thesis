"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  PenLine,
  Plus,
  FileText,
  Clock,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Palette,
  Maximize2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Info,
  PanelLeftClose,
  PanelLeft,
  Save,
  Filter,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { FullscreenEditor } from "./fullscreen-editor";

// Predefined gradients
const PRESET_GRADIENTS = [
  { name: "Security Red", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(0,70%,35%), hsl(20,80%,30%), hsl(350,60%,35%), hsl(10,70%,20%))" },
  { name: "Ocean Teal", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,70%,25%), hsl(200,80%,30%), hsl(170,60%,35%), hsl(190,70%,20%))" },
  { name: "Purple Haze", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(270,70%,35%), hsl(290,80%,30%), hsl(260,60%,40%), hsl(280,70%,25%))" },
  { name: "Emerald", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(140,70%,30%), hsl(160,80%,25%), hsl(130,60%,35%), hsl(150,70%,20%))" },
  { name: "Amber Glow", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(40,80%,45%), hsl(30,90%,40%), hsl(45,70%,50%), hsl(35,85%,35%))" },
  { name: "Sunset", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(15,80%,50%), hsl(30,90%,45%), hsl(350,70%,45%), hsl(10,85%,40%))" },
  { name: "Deep Blue", value: "linear-gradient(45deg, hsl(220,70%,15%), hsl(230,80%,35%), hsl(240,70%,30%), hsl(225,75%,40%), hsl(235,80%,25%))" },
  { name: "Cyber", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,100%,35%), hsl(200,90%,30%), hsl(160,80%,40%), hsl(190,95%,25%))" },
];

// Categories
const CATEGORIES = [
  "Vulnerability Analysis", "Security Testing", "Web Security", "DevSecOps",
  "Cloud Security", "API Security", "Mobile Security", "General",
];

// Available icons
const ICONS = [
  { name: "Shield" }, { name: "Code" }, { name: "Zap" }, { name: "Lock" },
  { name: "AlertTriangle" }, { name: "Bug" }, { name: "Eye" }, { name: "Key" },
  { name: "Server" }, { name: "Database" }, { name: "Globe" }, { name: "Wifi" },
  { name: "Terminal" }, { name: "FileCode" }, { name: "GitBranch" }, { name: "Cloud" },
  { name: "Cpu" }, { name: "HardDrive" },
];

// Tab configuration
const TABS = [
  { id: "all", label: "All", status: null },
  { id: "draft", label: "Draft", status: "DRAFT" },
  { id: "pending", label: "Pending", status: "PENDING_REVIEW" },
  { id: "in_review", label: "In Review", status: "IN_REVIEW" },
  { id: "published", label: "Published", status: "PUBLISHED" },
  { id: "rejected", label: "Rejected", status: "REJECTED" },
  { id: "pending_deletion", label: "Pending Deletion", status: "SCHEDULED_FOR_DELETION" },
];

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { label: "Draft", icon: FileText, color: "bg-secondary text-secondary-foreground" },
  PENDING_REVIEW: { label: "Pending", icon: Clock, color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  IN_REVIEW: { label: "In Review", icon: Eye, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  PUBLISHED: { label: "Published", icon: CheckCircle, color: "bg-green-500/15 text-green-600 dark:text-green-400" },
  APPROVED: { label: "Published", icon: CheckCircle, color: "bg-green-500/15 text-green-600 dark:text-green-400" },
  REJECTED: { label: "Rejected", icon: XCircle, color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  SCHEDULED_FOR_DELETION: { label: "Pending Deletion", icon: Trash2, color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
};

const ITEMS_PER_PAGE = 10;
const ICONS_PER_PAGE = 9;

// Icon position options
const ICON_POSITIONS = [
  { id: "top-left", label: "Top Left", class: "items-start justify-start" },
  { id: "top-center", label: "Top Center", class: "items-start justify-center" },
  { id: "top-right", label: "Top Right", class: "items-start justify-end" },
  { id: "center-left", label: "Center Left", class: "items-center justify-start" },
  { id: "center", label: "Center", class: "items-center justify-center" },
  { id: "center-right", label: "Center Right", class: "items-center justify-end" },
  { id: "bottom-left", label: "Bottom Left", class: "items-end justify-start" },
  { id: "bottom-center", label: "Bottom Center", class: "items-end justify-center" },
  { id: "bottom-right", label: "Bottom Right", class: "items-end justify-end" },
];

// Icon color options
const ICON_COLORS = [
  { id: "white", label: "White", value: "#ffffff", bg: "bg-black/40" },
  { id: "black", label: "Black", value: "#000000", bg: "bg-white/40" },
  { id: "red", label: "Red", value: "#ef4444", bg: "bg-black/40" },
  { id: "orange", label: "Orange", value: "#f97316", bg: "bg-black/40" },
  { id: "amber", label: "Amber", value: "#f59e0b", bg: "bg-black/40" },
  { id: "yellow", label: "Yellow", value: "#eab308", bg: "bg-black/40" },
  { id: "lime", label: "Lime", value: "#84cc16", bg: "bg-black/40" },
  { id: "green", label: "Green", value: "#22c55e", bg: "bg-black/40" },
  { id: "emerald", label: "Emerald", value: "#10b981", bg: "bg-black/40" },
  { id: "teal", label: "Teal", value: "#14b8a6", bg: "bg-black/40" },
  { id: "cyan", label: "Cyan", value: "#06b6d4", bg: "bg-black/40" },
  { id: "sky", label: "Sky", value: "#0ea5e9", bg: "bg-black/40" },
  { id: "blue", label: "Blue", value: "#3b82f6", bg: "bg-black/40" },
  { id: "indigo", label: "Indigo", value: "#6366f1", bg: "bg-black/40" },
  { id: "violet", label: "Violet", value: "#8b5cf6", bg: "bg-black/40" },
  { id: "purple", label: "Purple", value: "#a855f7", bg: "bg-black/40" },
  { id: "fuchsia", label: "Fuchsia", value: "#d946ef", bg: "bg-black/40" },
  { id: "pink", label: "Pink", value: "#ec4899", bg: "bg-black/40" },
  { id: "rose", label: "Rose", value: "#f43f5e", bg: "bg-black/40" },
];

export function ArticleEditor() {
  const { data: session } = useSession();

  // Articles state
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [refreshingTab, setRefreshingTab] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [articleSearchTerm, setArticleSearchTerm] = useState("");

  // Pagination state per tab
  const [pages, setPages] = useState({
    all: 1, draft: 1, pending: 1, in_review: 1, published: 1, rejected: 1, pending_deletion: 1,
  });

  // Edit form state
  const [editFormState, setEditFormState] = useState({
    title: "", excerpt: "", category: "General",
    coverType: "gradient", gradient: PRESET_GRADIENTS[0].value,
    coverImage: "", iconName: "Shield", iconPosition: "center", iconColor: "white",
  });

  // Icon search and pagination
  const [iconSearch, setIconSearch] = useState("");
  const [iconPage, setIconPage] = useState(1);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/articles");
      if (!response.ok) throw new Error("Failed to fetch articles");
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchArticles();
    }
  }, [session, fetchArticles]);

  // Create new article
  const handleCreateArticle = async () => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Article", category: "General" }),
      });
      if (!response.ok) throw new Error("Failed to create article");
      const data = await response.json();
      setArticles((prev) => [data.article, ...prev]);
      setSelectedArticle(data.article);
      setEditFormState({
        title: data.article.title || "",
        excerpt: data.article.excerpt || "",
        category: data.article.category || "General",
        coverType: data.article.coverType || "gradient",
        gradient: data.article.gradient || PRESET_GRADIENTS[0].value,
        coverImage: data.article.coverImage || "",
        iconName: data.article.iconName || "Shield",
        iconPosition: data.article.iconPosition || "center",
        iconColor: data.article.iconColor || "white",
      });
      toast.success("Draft article created.");
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error("Failed to create article");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      setDeletingId(articleToDelete.id);
      const response = await fetch(`/api/articles/${articleToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete article");
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      if (selectedArticle?.id === articleToDelete.id) {
        setSelectedArticle(null);
      }
      toast.success("Article deleted");
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
      setDeletingId(null);
    }
  };

  // Submit for review
  const handleSubmitForReview = async (article) => {
    try {
      setSubmittingId(article.id);
      const response = await fetch(`/api/articles/${article.id}/submit`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit article");
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, status: "PENDING_REVIEW", submittedAt: new Date().toISOString() } : a
        )
      );
      if (selectedArticle?.id === article.id) {
        setSelectedArticle((prev) => ({ ...prev, status: "PENDING_REVIEW" }));
      }
      toast.success(data.message || "Article submitted for review");
    } catch (error) {
      console.error("Error submitting article:", error);
      toast.error(error.message || "Failed to submit article");
    } finally {
      setSubmittingId(null);
    }
  };

  // Import rejected/scheduled-for-deletion article back to drafts
  const handleImportToDrafts = async (article) => {
    try {
      setSubmittingId(article.id);
      const response = await fetch(`/api/articles/${article.id}/import-to-drafts`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to import article");
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, status: "DRAFT", scheduledForDeletionAt: null, rejectedAt: null } : a
        )
      );
      if (selectedArticle?.id === article.id) {
        setSelectedArticle((prev) => ({ ...prev, status: "DRAFT", scheduledForDeletionAt: null, rejectedAt: null }));
      }
      toast.success(data.message || "Article imported to drafts");
    } catch (error) {
      console.error("Error importing article:", error);
      toast.error(error.message || "Failed to import article");
    } finally {
      setSubmittingId(null);
    }
  };

  // Update article metadata
  const handleUpdateArticle = async () => {
    if (!selectedArticle) return;
    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editFormState.title,
          excerpt: editFormState.excerpt,
          category: editFormState.category,
          coverType: editFormState.coverType,
          gradient: editFormState.coverType === "gradient" ? editFormState.gradient : null,
          coverImage: editFormState.coverType === "image" ? editFormState.coverImage : null,
          iconName: editFormState.iconName,
          iconPosition: editFormState.iconPosition,
          iconColor: editFormState.iconColor,
        }),
      });
      if (!response.ok) throw new Error("Failed to update article");
      const data = await response.json();
      setArticles((prev) => prev.map((a) => (a.id === selectedArticle.id ? { ...a, ...data.article } : a)));
      setSelectedArticle((prev) => ({ ...prev, ...data.article }));
      toast.success("Article saved");
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Failed to update article");
    }
  };

  // Refresh only the current category/tab
  const handleRefreshCategory = async () => {
    setRefreshingTab(activeTab);
    await fetchArticles();
    setRefreshingTab(null);
    const tabLabel = TABS.find(t => t.id === activeTab)?.label || "Articles";
    toast.success(`${tabLabel} refreshed`);
  };

  // Refresh all articles from all categories
  const handleRefreshAll = async () => {
    setRefreshingTab("all_global");
    await fetchArticles();
    setRefreshingTab(null);
    toast.success("All articles refreshed");
  };

  // Select article for editing
  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    setEditFormState({
      title: article.title || "",
      excerpt: article.excerpt || "",
      category: article.category || "General",
      coverType: article.coverType || "gradient",
      gradient: article.gradient || PRESET_GRADIENTS[0].value,
      coverImage: article.coverImage || "",
      iconName: article.iconName || "Shield",
      iconPosition: article.iconPosition || "center",
      iconColor: article.iconColor || "white",
    });
  };

  // Handle article update from fullscreen editor
  const handleArticleUpdate = (updates) => {
    setArticles((prev) => prev.map((a) => (a.id === updates.id ? { ...a, ...updates } : a)));
    if (selectedArticle?.id === updates.id) {
      setSelectedArticle((prev) => ({ ...prev, ...updates }));
    }
  };

  // Filter articles by tab and search
  const getFilteredArticles = (tabId) => {
    const tab = TABS.find((t) => t.id === tabId);
    let filtered = articles;
    
    // Filter by status
    if (tab && tab.status) {
      if (tab.status === "PUBLISHED") {
        filtered = filtered.filter((a) => a.status === "PUBLISHED" || a.status === "APPROVED");
      } else {
        filtered = filtered.filter((a) => a.status === tab.status);
      }
    }
    
    // Filter by search term
    if (articleSearchTerm.trim()) {
      const searchLower = articleSearchTerm.toLowerCase();
      filtered = filtered.filter((a) =>
        a.title?.toLowerCase().includes(searchLower) ||
        a.excerpt?.toLowerCase().includes(searchLower) ||
        a.category?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // Paginated articles
  const getPaginatedArticles = (tabId) => {
    const filtered = getFilteredArticles(tabId);
    const page = pages[tabId] || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    return {
      items: filtered.slice(start, start + ITEMS_PER_PAGE),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
      currentPage: page,
    };
  };

  // Get counts for tabs
  const getCounts = () => ({
    all: articles.length,
    draft: articles.filter((a) => a.status === "DRAFT").length,
    pending: articles.filter((a) => a.status === "PENDING_REVIEW").length,
    in_review: articles.filter((a) => a.status === "IN_REVIEW").length,
    published: articles.filter((a) => a.status === "PUBLISHED" || a.status === "APPROVED").length,
    rejected: articles.filter((a) => a.status === "REJECTED").length,
    pending_deletion: articles.filter((a) => a.status === "SCHEDULED_FOR_DELETION").length,
  });

  const counts = getCounts();

  // Icon filtering and pagination
  const filteredIcons = ICONS.filter((icon) => icon.name.toLowerCase().includes(iconSearch.toLowerCase()));
  const totalIconPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const paginatedIcons = filteredIcons.slice((iconPage - 1) * ICONS_PER_PAGE, iconPage * ICONS_PER_PAGE);

  useEffect(() => { setIconPage(1); }, [iconSearch]);

  // Truncate excerpt
  const truncateExcerpt = (text, maxLength = 60) => {
    if (!text) return "No excerpt";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <PenLine className="h-5 w-5" />
              Sign in Required
            </CardTitle>
            <CardDescription>Please sign in to write and manage your blog articles.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const canEdit = selectedArticle && selectedArticle.status !== "PUBLISHED" && selectedArticle.status !== "APPROVED";
  const canSubmit = selectedArticle && ["DRAFT", "REJECTED"].includes(selectedArticle.status);

  return (
    <div className="flex h-full gap-2 sm:gap-4 p-2 sm:p-4">
      {/* Left Sidebar - Articles List Card */}
      {/* On mobile: absolute overlay, on desktop: side panel */}
      <Card className={cn(
        "flex flex-col transition-all duration-300 ease-in-out shrink-0",
        "max-md:absolute max-md:inset-2 max-md:z-50 max-md:shadow-xl",
        sidebarOpen ? "w-full sm:w-72 md:w-80" : "w-0 p-0 border-0 overflow-hidden max-md:hidden"
      )}>
        {sidebarOpen && (
          <>
            <CardHeader className="pb-3 space-y-0 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-sm sm:text-base whitespace-nowrap">Your Articles</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{counts.all}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefreshAll} disabled={refreshingTab !== null}>
                          <RefreshCw className={cn("h-4 w-4", refreshingTab === "all_global" && "animate-spin")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh all</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
                          <PanelLeftClose className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Close sidebar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Status filter dropdown instead of cluttered tabs */}
              <div className="px-4 py-3 border-b space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full h-9">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {TABS.map((tab) => (
                        <SelectItem key={tab.id} value={tab.id}>
                          <div className="flex items-center justify-between w-full gap-3">
                            <span>{tab.label}</span>
                            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 font-normal">
                              {counts[tab.id]}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleRefreshCategory} disabled={refreshingTab !== null}>
                          <RefreshCw className={cn("h-4 w-4", refreshingTab === activeTab && "animate-spin")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh {TABS.find(t => t.id === activeTab)?.label || "category"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${TABS.find(t => t.id === activeTab)?.label || "articles"}...`}
                    value={articleSearchTerm}
                    onChange={(e) => setArticleSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              {/* Articles list */}
              {(() => {
                const { items, total, totalPages, currentPage } = getPaginatedArticles(activeTab);
                return (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                      <span className="text-xs text-muted-foreground">{total} article{total !== 1 ? "s" : ""}</span>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="p-3 space-y-2">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : items.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="rounded-full bg-muted p-3 mb-3">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No articles</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activeTab === "all" ? "Create your first article" : `No ${TABS.find(t => t.id === activeTab)?.label.toLowerCase() || ''} articles`}
                            </p>
                          </div>
                        ) : (
                          items.map((article) => {
                            const statusConfig = STATUS_CONFIG[article.status] || STATUS_CONFIG.DRAFT;
                            const StatusIcon = statusConfig.icon;
                            const isDraft = article.status === "DRAFT";
                            const isRejected = article.status === "REJECTED";
                            const isScheduledForDeletion = article.status === "SCHEDULED_FOR_DELETION";
                            const canImportToDrafts = isRejected || isScheduledForDeletion;
                            const isSelected = selectedArticle?.id === article.id;

                            return (
                              <Card
                                key={article.id}
                                className={cn(
                                  "cursor-pointer transition-all hover:shadow-md",
                                  isSelected && "ring-2 ring-primary shadow-md"
                                )}
                                onClick={() => handleSelectArticle(article)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm truncate flex-1">{article.title || "Untitled"}</p>
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{truncateExcerpt(article.excerpt)}</p>
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        <Badge variant="secondary" className={cn("text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 shrink-0", statusConfig.color)}>
                                          <StatusIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1" />
                                          <span className="truncate max-w-[60px] sm:max-w-none">{statusConfig.label}</span>
                                        </Badge>
                                        {article.readTime && (
                                          <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                                            <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />{article.readTime}
                                          </span>
                                        )}
                                        {article.scheduledForDeletionAt && (
                                          <span className="text-[9px] sm:text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-0.5 truncate">
                                            <span className="hidden sm:inline">Deletes:</span> {new Date(article.scheduledForDeletionAt).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-1 shrink-0">
                                      {/* Import to Drafts button - for rejected and scheduled for deletion */}
                                      {canImportToDrafts && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleImportToDrafts(article); }} disabled={submittingId === article.id}>
                                                {submittingId === article.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Import to Drafts</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {/* Submit for review button - only for drafts */}
                                      {isDraft && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleSubmitForReview(article); }} disabled={submittingId === article.id}>
                                                {submittingId === article.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Submit for review</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {/* Delete button - for all articles */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setArticleToDelete(article); setDeleteDialogOpen(true); }} disabled={deletingId === article.id}>
                                              {deletingId === article.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Delete</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
                        <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPages((p) => ({ ...p, [activeTab]: Math.max(1, p[activeTab] - 1) }))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPages((p) => ({ ...p, [activeTab]: Math.min(totalPages, p[activeTab] + 1) }))} disabled={currentPage === totalPages}>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* New Article button at bottom of content */}
              <div className="p-3 border-t mt-auto">
                <Button onClick={handleCreateArticle} disabled={isCreating} className="w-full">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  New Article
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Right Panel - Edit Article Card */}
      <Card className="flex-1 flex flex-col min-h-0 min-w-0">
        <CardHeader className="pb-2 sm:pb-3 shrink-0 border-b px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Show open sidebar button when sidebar is closed OR always on mobile */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className={cn("h-8 w-8 shrink-0", sidebarOpen && "md:hidden")} onClick={() => setSidebarOpen(!sidebarOpen)}>
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{sidebarOpen ? "Close sidebar" : "Open sidebar"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <PenLine className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedArticle ? "Edit Article" : "Write Article"}</span>
                </CardTitle>
                {selectedArticle && (
                  <CardDescription className="truncate max-w-full sm:max-w-[300px]">{selectedArticle.title || "Untitled"}</CardDescription>
                )}
              </div>
            </div>
            {selectedArticle && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Badge className={cn("font-normal text-[10px] sm:text-xs shrink-0", STATUS_CONFIG[selectedArticle.status]?.color)}>
                  {React.createElement(STATUS_CONFIG[selectedArticle.status]?.icon || FileText, { className: "h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" })}
                  <span className="hidden xs:inline">{STATUS_CONFIG[selectedArticle.status]?.label || "Unknown"}</span>
                </Badge>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={handleUpdateArticle} className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <Save className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                )}
                {canSubmit && (
                  <Button size="sm" onClick={() => handleSubmitForReview(selectedArticle)} disabled={submittingId === selectedArticle.id} className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    {submittingId === selectedArticle.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    <span className="hidden sm:inline">Submit</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {selectedArticle ? (
          <>
            <CardContent className="flex-1 min-h-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                  {/* Cover Section Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Cover</CardTitle>
                      <CardDescription className="text-xs">Choose a gradient or upload an image</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cover Preview with Icon */}
                      <div
                        className="relative h-36 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50"
                        style={{
                          background: editFormState.coverType === "gradient"
                            ? editFormState.gradient
                            : (editFormState.coverImage ? `url(${editFormState.coverImage}) center/cover no-repeat` : "hsl(var(--muted))"),
                          backgroundSize: editFormState.coverType === "gradient" ? "200% 200%" : "cover"
                        }}
                      >
                        {editFormState.coverType === "image" && !editFormState.coverImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        {editFormState.iconName && (
                          <div className={cn(
                            "absolute inset-0 flex p-4",
                            ICON_POSITIONS.find(p => p.id === editFormState.iconPosition)?.class || "items-center justify-center"
                          )}>
                            <div className={cn(
                              "backdrop-blur-sm rounded-full p-4 shadow-lg",
                              ICON_COLORS.find(c => c.id === editFormState.iconColor)?.bg || "bg-black/40"
                            )}>
                              <IconDisplay
                                name={editFormState.iconName}
                                className="h-10 w-10"
                                style={{ color: ICON_COLORS.find(c => c.id === editFormState.iconColor)?.value || "#ffffff" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Tabs value={editFormState.coverType} onValueChange={(v) => setEditFormState((s) => ({ ...s, coverType: v }))}>
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="gradient" className="text-xs">
                            <Palette className="h-3.5 w-3.5 mr-1.5" />Gradient
                          </TabsTrigger>
                          <TabsTrigger value="image" className="text-xs">
                            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />Image
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="gradient" className="space-y-4 mt-4">
                          <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5 sm:gap-2">
                            {PRESET_GRADIENTS.map((g) => (
                              <TooltipProvider key={g.name}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className={cn(
                                        "h-10 rounded-md transition-all",
                                        editFormState.gradient === g.value
                                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                          : "ring-1 ring-border/50 hover:ring-2 hover:ring-muted-foreground/50"
                                      )}
                                      style={{ background: g.value }}
                                      onClick={() => setEditFormState((s) => ({ ...s, gradient: g.value }))}
                                      disabled={!canEdit}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>{g.name}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="image" className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Image URL</Label>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              value={editFormState.coverImage}
                              onChange={(e) => setEditFormState((s) => ({ ...s, coverImage: e.target.value }))}
                              disabled={!canEdit}
                            />
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Upload from device</Label>
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                              "hover:bg-muted/50 hover:border-primary/50",
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}>
                              <div className="flex flex-col items-center justify-center py-4">
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium text-primary">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, GIF, WebP</p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={!canEdit}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEditFormState((s) => ({ ...s, coverImage: reader.result }));
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Icon Selection Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Article Icon</CardTitle>
                      <CardDescription className="text-xs">Select an icon to display on your article cover</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search icons..."
                          value={iconSearch}
                          onChange={(e) => setIconSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                        {paginatedIcons.map((icon) => (
                          <TooltipProvider key={icon.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={editFormState.iconName === icon.name ? "default" : "outline"}
                                  size="icon"
                                  className={cn("h-11 w-full", editFormState.iconName === icon.name && "ring-2 ring-primary/20")}
                                  onClick={() => setEditFormState((s) => ({ ...s, iconName: s.iconName === icon.name ? "" : icon.name }))}
                                  disabled={!canEdit}
                                >
                                  <IconDisplay name={icon.name} className="h-5 w-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{icon.name}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      {totalIconPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIconPage((p) => Math.max(1, p - 1))} disabled={iconPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground min-w-[60px] text-center">{iconPage} / {totalIconPages}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIconPage((p) => Math.min(totalIconPages, p + 1))} disabled={iconPage === totalIconPages}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Icon Position & Color Selector - only shown when icon is selected */}
                      {editFormState.iconName && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Icon Position */}
                            <div className="space-y-3">
                              <Label className="text-xs text-muted-foreground">Position</Label>
                              <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
                                {ICON_POSITIONS.map((pos) => (
                                  <TooltipProvider key={pos.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className={cn(
                                            "h-8 w-full rounded-md transition-all flex",
                                            pos.class,
                                            "p-1",
                                            editFormState.iconPosition === pos.id
                                              ? "bg-background shadow-sm ring-2 ring-primary"
                                              : "hover:bg-background/50"
                                          )}
                                          onClick={() => setEditFormState((s) => ({ ...s, iconPosition: pos.id }))}
                                          disabled={!canEdit}
                                        >
                                          <div className={cn(
                                            "w-2 h-2 rounded-full transition-colors",
                                            editFormState.iconPosition === pos.id ? "bg-primary" : "bg-muted-foreground/40"
                                          )} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">{pos.label}</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            </div>

                            {/* Icon Color */}
                            <div className="space-y-3">
                              <Label className="text-xs text-muted-foreground">Color</Label>
                              <div className="grid grid-cols-6 gap-1.5">
                                {ICON_COLORS.slice(0, 12).map((color) => (
                                  <TooltipProvider key={color.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className={cn(
                                            "h-7 w-full rounded-md transition-all border-2",
                                            editFormState.iconColor === color.id
                                              ? "border-primary ring-2 ring-primary/20 scale-110"
                                              : "border-transparent hover:scale-105"
                                          )}
                                          style={{ backgroundColor: color.value }}
                                          onClick={() => setEditFormState((s) => ({ ...s, iconColor: color.id }))}
                                          disabled={!canEdit}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="top">{color.label}</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                              <div className="grid grid-cols-6 gap-1.5">
                                {ICON_COLORS.slice(12).map((color) => (
                                  <TooltipProvider key={color.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className={cn(
                                            "h-7 w-full rounded-md transition-all border-2",
                                            editFormState.iconColor === color.id
                                              ? "border-primary ring-2 ring-primary/20 scale-110"
                                              : "border-transparent hover:scale-105"
                                          )}
                                          style={{ backgroundColor: color.value }}
                                          onClick={() => setEditFormState((s) => ({ ...s, iconColor: color.id }))}
                                          disabled={!canEdit}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="top">{color.label}</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Article Details Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Article Details</CardTitle>
                      <CardDescription className="text-xs">Title, excerpt, and category</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Enter article title..."
                          value={editFormState.title}
                          onChange={(e) => setEditFormState((s) => ({ ...s, title: e.target.value }))}
                          disabled={!canEdit}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Excerpt</Label>
                        <Textarea
                          placeholder="Write a short description..."
                          value={editFormState.excerpt}
                          onChange={(e) => setEditFormState((s) => ({ ...s, excerpt: e.target.value }))}
                          rows={3}
                          disabled={!canEdit}
                        />
                        <p className="text-xs text-muted-foreground">This will appear on article cards and search results</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={editFormState.category} onValueChange={(v) => setEditFormState((s) => ({ ...s, category: v }))} disabled={!canEdit}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content Editor Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Content</CardTitle>
                      <CardDescription className="text-xs">Write your article content</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Your progress is automatically saved every 30 seconds, when you switch tabs, and when you close the editor.
                        </AlertDescription>
                      </Alert>
                      <Button onClick={() => setIsFullscreenOpen(true)} className="w-full" size="lg" disabled={!canEdit}>
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Open Fullscreen Editor
                      </Button>
                      {selectedArticle.readTime && (
                        <p className="text-xs text-muted-foreground text-center">
                          Estimated read time: <span className="font-medium">{selectedArticle.readTime}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No article selected</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">
              Select an article from the sidebar to edit, or create a new one to get started.
            </p>
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button variant="outline" onClick={() => setSidebarOpen(true)}>
                  <PanelLeft className="h-4 w-4 mr-2" />
                  Open Sidebar
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{articleToDelete?.title || "this article"}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fullscreen Editor */}
      <FullscreenEditor open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen} article={selectedArticle} onArticleUpdate={handleArticleUpdate} />
    </div>
  );
}

// Icon display component
function IconDisplay({ name, className, style }) {
  const icons = {
    Shield: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
    Code: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    Zap: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    Lock: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    AlertTriangle: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
    Bug: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>,
    Eye: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
    Key: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>,
    Server: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>,
    Database: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
    Globe: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
    Wifi: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>,
    Terminal: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>,
    FileCode: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>,
    GitBranch: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
    Cloud: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
    Cpu: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>,
    HardDrive: (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>,
  };
  const Icon = icons[name] || icons.Shield;
  return <Icon className={className} style={style} />;
}

