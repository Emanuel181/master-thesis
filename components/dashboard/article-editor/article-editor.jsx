"use client"

import React from "react"
import { FileText, Clock, CheckCircle, XCircle, Trash2, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PenLine } from "lucide-react"

// Custom hooks
import { useArticles } from "@/hooks/use-articles"
import { useArticleForm } from "@/hooks/use-article-form"

// Components
import { ArticleList } from "./_components/article-list"
import { ArticleForm } from "./_components/article-form"
import { DeleteArticleDialog } from "./_components/article-dialogs"
import { FullscreenEditor } from "./fullscreen-editor"

// Status configuration with icons
const STATUS_CONFIG = {
    DRAFT: { label: "Draft", icon: FileText, color: "bg-secondary text-secondary-foreground" },
    PENDING_REVIEW: { label: "Pending", icon: Clock, color: "bg-severity-medium/15 text-severity-medium" },
    IN_REVIEW: { label: "In review", icon: Eye, color: "bg-primary/15 text-primary" },
    PUBLISHED: { label: "Published", icon: CheckCircle, color: "bg-success/15 text-success" },
    APPROVED: { label: "Published", icon: CheckCircle, color: "bg-success/15 text-success" },
    REJECTED: { label: "Rejected", icon: XCircle, color: "bg-destructive/15 text-destructive" },
    SCHEDULED_FOR_DELETION: { label: "Pending deletion", icon: Trash2, color: "bg-severity-high/15 text-severity-high" },
}

/**
 * ArticleEditor - Main component for article management and editing.
 * Refactored to use custom hooks and extracted sub-components.
 */
export function ArticleEditor() {
    // Articles hook for CRUD and state management
    const articles = useArticles()

    // Form hook for editing state
    const form = useArticleForm(
        articles.selectedArticle,
        articles.isFullscreenOpen,
        articles.handleArticleUpdate
    )

    // Handle article selection
    const handleSelectArticle = (article) => {
        articles.setSelectedArticle(article)
        form.initializeForm(article)
    }

    // Handle create article
    const handleCreateArticle = async () => {
        const newArticle = await articles.createArticle()
        if (newArticle) {
            // Switch to 'all' or 'draft' tab to show the new article
            if (articles.activeTab !== 'all' && articles.activeTab !== 'draft') {
                articles.setActiveTab('draft')
            }
            articles.setSelectedArticle(newArticle)
            form.initializeForm(newArticle)
        }
    }

    // Not authenticated
    if (!articles.session?.user) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <PenLine className="h-5 w-5" />
                            Sign in Required
                        </CardTitle>
                        <CardDescription>
                            Please sign in to write and manage your blog articles.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex h-full gap-2 sm:gap-4 p-2 sm:p-4">
            {/* Left Sidebar - Articles List */}
            <ArticleList
                articles={articles.articles}
                isLoading={articles.isLoading}
                isCreating={articles.isCreating}
                activeTab={articles.activeTab}
                setActiveTab={articles.setActiveTab}
                selectedArticle={articles.selectedArticle}
                onSelectArticle={handleSelectArticle}
                sidebarOpen={articles.sidebarOpen}
                setSidebarOpen={articles.setSidebarOpen}
                articleSearchTerm={articles.articleSearchTerm}
                setArticleSearchTerm={articles.setArticleSearchTerm}
                refreshingTab={articles.refreshingTab}
                deletingId={articles.deletingId}
                submittingId={articles.submittingId}
                onRefreshAll={articles.refreshAll}
                onRefreshCategory={articles.refreshCategory}
                onCreateArticle={handleCreateArticle}
                onSubmitForReview={articles.submitForReview}
                onImportToDrafts={articles.importToDrafts}
                onDelete={articles.openDeleteDialog}
                getPaginatedArticles={articles.getPaginatedArticles}
                setPage={articles.setPage}
                counts={articles.getCounts()}
                tabs={articles.TABS}
                statusConfig={STATUS_CONFIG}
            />

            {/* Right Panel - Article Form */}
            <ArticleForm
                selectedArticle={articles.selectedArticle}
                sidebarOpen={articles.sidebarOpen}
                setSidebarOpen={articles.setSidebarOpen}
                formState={form.formState}
                updateField={form.updateField}
                canEdit={form.canEdit}
                canSubmit={form.canSubmit}
                submittingId={articles.submittingId}
                statusConfig={STATUS_CONFIG}
                onSave={() => form.saveArticle(false)}
                onSubmitForReview={articles.submitForReview}
                onOpenFullscreen={() => articles.setIsFullscreenOpen(true)}
                // Icon props
                iconSearch={form.iconSearch}
                setIconSearch={form.setIconSearch}
                iconPage={form.iconPage}
                setIconPage={form.setIconPage}
                paginatedIcons={form.paginatedIcons}
                totalIconPages={form.totalIconPages}
                onToggleIcon={form.toggleIcon}
                // Constants
                presetGradients={form.PRESET_GRADIENTS}
                categories={form.CATEGORIES}
                iconPositions={form.ICON_POSITIONS}
                iconColors={form.ICON_COLORS}
                // Auto-save
                lastSavedAt={form.lastSavedAt}
                onCoverImageUpload={form.handleCoverImageUpload}
            />

            {/* Delete Dialog */}
            <DeleteArticleDialog
                open={articles.deleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) articles.closeDeleteDialog()
                }}
                articleToDelete={articles.articleToDelete}
                onConfirm={articles.deleteArticle}
            />

            {/* Fullscreen Editor */}
            <FullscreenEditor
                open={articles.isFullscreenOpen}
                onOpenChange={articles.setIsFullscreenOpen}
                article={articles.selectedArticle}
                onArticleUpdate={articles.handleArticleUpdate}
            />
        </div>
    )
}
