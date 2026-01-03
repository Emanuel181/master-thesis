"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  PenLine,
  Plus,
  FileText,
  Clock,
  Send,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Palette,
  Maximize2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { FullscreenEditor } from "./fullscreen-editor";

// Predefined gradients inspired by existing blog posts
const PRESET_GRADIENTS = [
  {
    name: "Security Red",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(0,70%,35%), hsl(20,80%,30%), hsl(350,60%,35%), hsl(10,70%,20%))",
  },
  {
    name: "Ocean Teal",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,70%,25%), hsl(200,80%,30%), hsl(170,60%,35%), hsl(190,70%,20%))",
  },
  {
    name: "Purple Haze",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(270,70%,35%), hsl(290,80%,30%), hsl(260,60%,40%), hsl(280,70%,25%))",
  },
  {
    name: "Emerald",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(140,70%,30%), hsl(160,80%,25%), hsl(130,60%,35%), hsl(150,70%,20%))",
  },
  {
    name: "Amber Glow",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(40,80%,45%), hsl(30,90%,40%), hsl(45,70%,50%), hsl(35,85%,35%))",
  },
  {
    name: "Sunset",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(15,80%,50%), hsl(30,90%,45%), hsl(350,70%,45%), hsl(10,85%,40%))",
  },
  {
    name: "Deep Blue",
    value: "linear-gradient(45deg, hsl(220,70%,15%), hsl(230,80%,35%), hsl(240,70%,30%), hsl(225,75%,40%), hsl(235,80%,25%))",
  },
  {
    name: "Cyber",
    value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,100%,35%), hsl(200,90%,30%), hsl(160,80%,40%), hsl(190,95%,25%))",
  },
];

// Article categories based on blog data
const CATEGORIES = [
  "Vulnerability Analysis",
  "Security Testing",
  "Web Security",
  "DevSecOps",
  "Cloud Security",
  "API Security",
  "Mobile Security",
  "General",
];

// Available icons for articles
const ICONS = [
  "Shield",
  "Code",
  "Zap",
  "Lock",
  "AlertTriangle",
  "Bug",
  "Eye",
  "Key",
  "Server",
  "Database",
];

// Status configuration
const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: FileText,
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  APPROVED: {
    label: "Published",
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

export function ArticleEditor() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's articles
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
        body: JSON.stringify({
          title: "Untitled Article",
          category: "General",
        }),
      });

      if (!response.ok) throw new Error("Failed to create article");

      const data = await response.json();
      setArticles((prev) => [data.article, ...prev]);
      setSelectedArticle(data.article);
      toast.success("Article created");
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
      const response = await fetch(`/api/articles/${articleToDelete.id}`, {
        method: "DELETE",
      });

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
    }
  };

  // Submit article for review
  const handleSubmitForReview = async (article) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/articles/${article.id}/submit`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit article");
      }

      // Update local state
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? { ...a, status: "PENDING_REVIEW", submittedAt: new Date().toISOString() }
            : a
        )
      );

      if (selectedArticle?.id === article.id) {
        setSelectedArticle((prev) => ({
          ...prev,
          status: "PENDING_REVIEW",
          submittedAt: new Date().toISOString(),
        }));
      }

      toast.success("Article submitted for review");
    } catch (error) {
      console.error("Error submitting article:", error);
      toast.error(error.message || "Failed to submit article");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update article metadata
  const handleUpdateArticle = async (updates) => {
    if (!selectedArticle) return;

    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update article");

      const data = await response.json();

      // Update local state
      setArticles((prev) =>
        prev.map((a) => (a.id === selectedArticle.id ? { ...a, ...data.article } : a))
      );
      setSelectedArticle((prev) => ({ ...prev, ...data.article }));
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Failed to update article");
    }
  };

  // Filter articles by tab
  const filteredArticles = articles.filter((article) => {
    if (activeTab === "all") return true;
    if (activeTab === "drafts") return article.status === "DRAFT";
    if (activeTab === "pending") return article.status === "PENDING_REVIEW";
    if (activeTab === "published") return article.status === "APPROVED";
    if (activeTab === "rejected") return article.status === "REJECTED";
    return true;
  });

  // Get counts for tabs
  const getCounts = () => ({
    all: articles.length,
    drafts: articles.filter((a) => a.status === "DRAFT").length,
    pending: articles.filter((a) => a.status === "PENDING_REVIEW").length,
    published: articles.filter((a) => a.status === "APPROVED").length,
    rejected: articles.filter((a) => a.status === "REJECTED").length,
  });

  const counts = getCounts();

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              Please sign in to write and manage your blog articles.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="flex flex-col gap-4 p-4 pt-0 pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <PenLine className="h-5 w-5 sm:h-6 sm:w-6" />
              Write Article
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage your blog articles
            </p>
          </div>
          <Button onClick={handleCreateArticle} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New Article
          </Button>
        </div>

        {/* Main Content - Two Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Panel - Articles List */}
          <Card className="h-fit lg:h-[calc(100vh-220px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Articles</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-5 h-auto">
                  <TabsTrigger value="all" className="text-xs px-2 py-1.5">
                    All ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger value="drafts" className="text-xs px-2 py-1.5">
                    Drafts ({counts.drafts})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs px-2 py-1.5">
                    Pending ({counts.pending})
                  </TabsTrigger>
                  <TabsTrigger value="published" className="text-xs px-2 py-1.5">
                    Published ({counts.published})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="text-xs px-2 py-1.5">
                    Rejected ({counts.rejected})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] lg:h-[calc(100vh-380px)]">
                <div className="p-4 pt-0 space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredArticles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "all"
                          ? "No articles yet. Create your first one!"
                          : `No ${activeTab} articles.`}
                      </p>
                    </div>
                  ) : (
                    filteredArticles.map((article) => (
                      <ArticleListItem
                        key={article.id}
                        article={article}
                        isSelected={selectedArticle?.id === article.id}
                        onSelect={() => setSelectedArticle(article)}
                        onDelete={() => {
                          setArticleToDelete(article);
                          setDeleteDialogOpen(true);
                        }}
                        onSubmit={() => handleSubmitForReview(article)}
                        isSubmitting={isSubmitting}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel - Article Editor */}
          <Card className="h-fit lg:h-[calc(100vh-220px)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {selectedArticle ? "Edit Article" : "Article Details"}
                </CardTitle>
                {selectedArticle && (
                  <Button
                    size="sm"
                    onClick={() => setIsFullscreenOpen(true)}
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Content
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] lg:h-[calc(100vh-360px)]">
                {selectedArticle ? (
                  <ArticleDetailsPanel
                    article={selectedArticle}
                    onUpdate={handleUpdateArticle}
                    onOpenEditor={() => setIsFullscreenOpen(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Edit3 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select an article to view details or create a new one.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Editor Dialog */}
      {selectedArticle && (
        <FullscreenEditor
          open={isFullscreenOpen}
          onOpenChange={setIsFullscreenOpen}
          article={selectedArticle}
          onArticleUpdate={(updated) => {
            setArticles((prev) =>
              prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
            );
            setSelectedArticle((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{articleToDelete?.title}&rdquo;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}

// Article List Item Component
function ArticleListItem({
  article,
  isSelected,
  onSelect,
  onDelete,
  onSubmit,
  isSubmitting,
}) {
  const statusConfig = STATUS_CONFIG[article.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;
  const canSubmit = article.status === "DRAFT" || article.status === "REJECTED";
  const canDelete = article.status !== "APPROVED";

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{article.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {article.excerpt || "No excerpt yet..."}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {article.readTime || "~1 min read"}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {canSubmit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onSubmit();
              }}
              disabled={isSubmitting}
              title="Submit for review"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {canDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete article"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Show admin feedback if rejected */}
      {article.status === "REJECTED" && article.adminFeedback && (
        <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive font-medium">Admin Feedback:</p>
          <p className="text-xs text-destructive/80 mt-1">{article.adminFeedback}</p>
        </div>
      )}
    </div>
  );
}

// Article Details Panel Component
function ArticleDetailsPanel({ article, onUpdate, onOpenEditor }) {
  const [formState, setFormState] = useState({
    title: article.title,
    excerpt: article.excerpt || "",
    category: article.category,
    iconName: article.iconName,
    coverType: article.coverType || "gradient",
    gradient: article.gradient || PRESET_GRADIENTS[0].value,
    coverImage: article.coverImage || "",
  });
  const debounceRef = useRef(null);
  const prevArticleIdRef = useRef(article.id);

  // Destructure for easier access
  const { title, excerpt, category, iconName, coverType, gradient, coverImage } = formState;

  // Helper to update individual fields
  const updateField = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Reset form when article changes - check during render to sync state
  if (prevArticleIdRef.current !== article.id) {
    prevArticleIdRef.current = article.id;
    setFormState({
      title: article.title,
      excerpt: article.excerpt || "",
      category: article.category,
      iconName: article.iconName,
      coverType: article.coverType || "gradient",
      gradient: article.gradient || PRESET_GRADIENTS[0].value,
      coverImage: article.coverImage || "",
    });
  }

  // Check for changes
  const hasChanges =
    title !== article.title ||
    excerpt !== (article.excerpt || "") ||
    category !== article.category ||
    iconName !== article.iconName ||
    coverType !== (article.coverType || "gradient") ||
    gradient !== (article.gradient || PRESET_GRADIENTS[0].value) ||
    coverImage !== (article.coverImage || "");

  // Debounced save
  const handleSave = useCallback(() => {
    if (!hasChanges) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onUpdate({
        title,
        excerpt,
        category,
        iconName,
        coverType,
        gradient: coverType === "gradient" ? gradient : null,
        coverImage: coverType === "image" ? coverImage : null,
      });
    }, 500);
  }, [title, excerpt, category, iconName, coverType, gradient, coverImage, hasChanges, onUpdate]);

  // Trigger save on changes
  useEffect(() => {
    handleSave();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [handleSave]);

  const isEditable = article.status !== "APPROVED";

  return (
    <div className="space-y-6 pr-4">
      {/* Cover Preview */}
      <div className="relative h-32 rounded-lg overflow-hidden border">
        <div
          className="absolute inset-0 transition-all"
          style={{
            background:
              coverType === "image" && coverImage
                ? `url(${coverImage}) center/cover`
                : gradient,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
          <p className="text-white/70 text-xs truncate mt-1">
            {excerpt || "No excerpt..."}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Badge
          variant="outline"
          className={STATUS_CONFIG[article.status]?.color}
        >
          {STATUS_CONFIG[article.status]?.label}
        </Badge>
      </div>

      <Separator />

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Article title..."
          disabled={!isEditable}
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          placeholder="Brief description of your article..."
          rows={3}
          disabled={!isEditable}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={(v) => updateField("category", v)} disabled={!isEditable}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label htmlFor="icon">Icon</Label>
        <Select value={iconName} onValueChange={(v) => updateField("iconName", v)} disabled={!isEditable}>
          <SelectTrigger>
            <SelectValue placeholder="Select icon" />
          </SelectTrigger>
          <SelectContent>
            {ICONS.map((icon) => (
              <SelectItem key={icon} value={icon}>
                {icon}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Cover Type */}
      <div className="space-y-2">
        <Label>Cover Type</Label>
        <div className="flex gap-2">
          <Button
            variant={coverType === "gradient" ? "default" : "outline"}
            size="sm"
            onClick={() => updateField("coverType", "gradient")}
            disabled={!isEditable}
            className="flex-1"
          >
            <Palette className="h-4 w-4 mr-2" />
            Gradient
          </Button>
          <Button
            variant={coverType === "image" ? "default" : "outline"}
            size="sm"
            onClick={() => updateField("coverType", "image")}
            disabled={!isEditable}
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </Button>
        </div>
      </div>

      {/* Gradient Selection */}
      {coverType === "gradient" && (
        <div className="space-y-2">
          <Label>Select Gradient</Label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_GRADIENTS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => updateField("gradient", preset.value)}
                disabled={!isEditable}
                className={`h-12 rounded-lg transition-all border-2 ${
                  gradient === preset.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-primary/50"
                }`}
                style={{ background: preset.value }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image URL */}
      {coverType === "image" && (
        <div className="space-y-2">
          <Label htmlFor="coverImage">Cover Image URL</Label>
          <Input
            id="coverImage"
            value={coverImage}
            onChange={(e) => updateField("coverImage", e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={!isEditable}
          />
        </div>
      )}

      {/* Edit Content Button */}
      {isEditable && (
        <Button onClick={onOpenEditor} className="w-full">
          <Maximize2 className="h-4 w-4 mr-2" />
          Open Fullscreen Editor
        </Button>
      )}

      {/* Read-only notice for published articles */}
      {!isEditable && (
        <div className="p-3 rounded-lg bg-muted text-center">
          <p className="text-sm text-muted-foreground">
            Published articles cannot be edited.
          </p>
        </div>
      )}
    </div>
  );
}

