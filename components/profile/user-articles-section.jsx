'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    FileText,
    Clock,
    Eye,
    ChevronRight,
    Loader2,
    PenLine,
    ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const STATUS_COLORS = {
    DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    PENDING_REVIEW: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    IN_REVIEW: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    PUBLISHED: 'bg-green-500/10 text-green-600 border-green-500/30',
    REJECTED: 'bg-red-500/10 text-red-600 border-red-500/30',
    SCHEDULED_FOR_DELETION: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
}

const STATUS_LABELS = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    IN_REVIEW: 'In Review',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
    SCHEDULED_FOR_DELETION: 'Pending Deletion',
}

export function UserArticlesSection() {
    const router = useRouter()
    const { data: session } = useSession()
    const [articles, setArticles] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchArticles() {
            if (!session?.user) return
            
            setIsLoading(true)
            try {
                const response = await fetch('/api/articles?limit=5')
                if (response.ok) {
                    const data = await response.json()
                    setArticles(data.articles || [])
                }
            } catch (error) {
                console.error('Failed to fetch articles:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchArticles()
    }, [session])

    const publishedCount = articles.filter(a => a.status === 'PUBLISHED').length
    const draftCount = articles.filter(a => a.status === 'DRAFT').length

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[var(--brand-accent)]" />
                        <CardTitle className="text-lg">Your Articles</CardTitle>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard?tab=write')}
                        className="gap-1"
                    >
                        <PenLine className="h-3.5 w-3.5" />
                        Write Article
                    </Button>
                </div>
                <CardDescription>
                    {publishedCount} published • {draftCount} drafts
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : articles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No articles yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Start writing to share your knowledge
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => router.push('/dashboard?tab=write')}
                        >
                            <PenLine className="h-3.5 w-3.5 mr-1" />
                            Create Your First Article
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="h-[280px]">
                        <div className="space-y-3">
                            {articles.map((article) => (
                                <div
                                    key={article.id}
                                    className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => {
                                        if (article.status === 'PUBLISHED') {
                                            router.push(`/blog/${article.slug}`)
                                        } else {
                                            router.push('/dashboard?tab=write')
                                        }
                                    }}
                                >
                                    {/* Cover thumbnail */}
                                    <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden">
                                        {article.coverType === 'image' && article.coverImage ? (
                                            <img
                                                src={article.coverImage}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full"
                                                style={{
                                                    background: article.gradient || 'linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 100%)'
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-medium text-sm truncate group-hover:text-[var(--brand-accent)] transition-colors">
                                                {article.title || 'Untitled Article'}
                                            </h4>
                                            <Badge
                                                variant="outline"
                                                className={`shrink-0 text-[10px] px-1.5 py-0 ${STATUS_COLORS[article.status] || ''}`}
                                            >
                                                {STATUS_LABELS[article.status] || article.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                            {article.excerpt || 'No excerpt'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                            {article.readTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {article.readTime}
                                                </span>
                                            )}
                                            {article.status === 'PUBLISHED' && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    Published
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {articles.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push('/dashboard?tab=write')}
                    >
                        View All Articles
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export default UserArticlesSection

