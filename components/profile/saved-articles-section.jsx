'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Bookmark,
    Clock,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 5

// Mock data for demo
const MOCK_SAVED_ARTICLES = [
    {
        id: '1',
        title: 'OWASP Top 10 Security Risks Explained',
        slug: 'owasp-top-10-explained',
        excerpt: 'A comprehensive guide to the most critical web application security risks.',
        category: 'Web Security',
        authorName: 'VulnIQ Security',
        readTime: '12 min read',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        coverType: 'gradient',
    },
    {
        id: '2',
        title: 'Securing Your Node.js Applications',
        slug: 'securing-nodejs-apps',
        excerpt: 'Best practices for building secure Node.js backend services.',
        category: 'Backend',
        authorName: 'Security Team',
        readTime: '8 min read',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        coverType: 'gradient',
    },
    {
        id: '3',
        title: 'Cross-Site Scripting Prevention',
        slug: 'xss-prevention-guide',
        excerpt: 'How to identify and prevent XSS vulnerabilities in your applications.',
        category: 'Web Security',
        authorName: 'VulnIQ Security',
        readTime: '6 min read',
        gradient: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
        coverType: 'gradient',
    },
    {
        id: '4',
        title: 'Introduction to Penetration Testing',
        slug: 'intro-penetration-testing',
        excerpt: 'Getting started with ethical hacking and security assessments.',
        category: 'Pentesting',
        authorName: 'Security Expert',
        readTime: '15 min read',
        gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
        coverType: 'gradient',
    },
    {
        id: '5',
        title: 'Secure Password Storage Techniques',
        slug: 'secure-password-storage',
        excerpt: 'Modern approaches to hashing and storing user passwords safely.',
        category: 'Authentication',
        authorName: 'VulnIQ Security',
        readTime: '7 min read',
        gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
        coverType: 'gradient',
    },
    {
        id: '6',
        title: 'API Rate Limiting Strategies',
        slug: 'api-rate-limiting',
        excerpt: 'Protecting your APIs from abuse with effective rate limiting.',
        category: 'API Security',
        authorName: 'Dev Team',
        readTime: '5 min read',
        gradient: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
        coverType: 'gradient',
    },
]

export function SavedArticlesSection() {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session } = useSession()
    const [articles, setArticles] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [useMockData, setUseMockData] = useState(false)

    const isDemo = pathname?.includes('/demo')
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const fetchSavedArticles = async (page = 1) => {
        // Only use mock data on demo routes
        if (isDemo) {
            setUseMockData(true)
            const start = (page - 1) * ITEMS_PER_PAGE
            const paginatedMock = MOCK_SAVED_ARTICLES.slice(start, start + ITEMS_PER_PAGE)
            setArticles(paginatedMock)
            setTotalCount(MOCK_SAVED_ARTICLES.length)
            setIsLoading(false)
            return
        }

        if (!session?.user) {
            setIsLoading(false)
            return
        }
        
        setIsLoading(true)
        try {
            const skip = (page - 1) * ITEMS_PER_PAGE
            const response = await fetch(`/api/articles/saved?limit=${ITEMS_PER_PAGE}&skip=${skip}`)
            if (response.ok) {
                const data = await response.json()
                setUseMockData(false)
                setArticles(data.articles || [])
                setTotalCount(data.total || 0)
            }
        } catch (error) {
            console.error('Failed to fetch saved articles:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSavedArticles(currentPage)
    }, [session, currentPage, isDemo])

    const handleUnsave = async (e, articleId) => {
        e.stopPropagation()
        
        if (useMockData) {
            // Handle mock data removal
            setArticles(prev => prev.filter(a => a.id !== articleId))
            setTotalCount(prev => prev - 1)
            toast.success('Article removed from saved')
            return
        }

        try {
            const response = await fetch(`/api/articles/saved?articleId=${articleId}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                setTotalCount(prev => prev - 1)
                if (articles.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1)
                } else {
                    fetchSavedArticles(currentPage)
                }
                toast.success('Article removed from saved')
            }
        } catch (error) {
            toast.error('Failed to remove article')
        }
    }

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-[var(--brand-accent)] shrink-0" />
                        <CardTitle className="text-base sm:text-lg">Saved articles</CardTitle>
                    </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                    {totalCount} saved article{totalCount !== 1 ? 's' : ''}
                    {useMockData && <span className="text-muted-foreground/60"> (demo)</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : articles.length === 0 && currentPage === 1 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bookmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No saved articles</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Save articles while reading to find them here
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => router.push('/blog')}
                        >
                            Explore blog
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="h-[320px] sm:h-[300px]">
                            <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/blog/${article.slug}`)}
                                    >
                                        {/* Thumbnail - hidden on very small screens */}
                                        <div className="hidden xs:block shrink-0 w-12 h-10 sm:w-16 sm:h-12 rounded-md overflow-hidden">
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
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-1 sm:gap-2">
                                                <h4 className="font-medium text-xs sm:text-sm line-clamp-1 group-hover:text-[var(--brand-accent)] transition-colors">
                                                    {article.title || 'Untitled Article'}
                                                </h4>
                                                <Badge variant="outline" className="shrink-0 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 hidden sm:inline-flex">
                                                    {article.category}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {article.excerpt || 'No excerpt'}
                                            </p>
                                            <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                                                {article.readTime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        {article.readTime}
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground/60 truncate max-w-[100px] sm:max-w-none">
                                                    {article.authorName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 self-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                onClick={(e) => handleUnsave(e, article.id)}
                                                title="Remove from saved"
                                            >
                                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            </Button>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar />
                        </ScrollArea>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t mt-3 sm:mt-4">
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    {currentPage}/{totalPages}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default SavedArticlesSection
