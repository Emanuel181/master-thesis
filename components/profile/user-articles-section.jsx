'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    FileText,
    Clock,
    Eye,
    ChevronRight,
    ChevronLeft,
    Loader2,
    PenLine,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

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
    PENDING_REVIEW: 'Pending',
    IN_REVIEW: 'Review',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
    SCHEDULED_FOR_DELETION: 'Deleting',
}

const ITEMS_PER_PAGE = 5

// Mock data for demo
const MOCK_ARTICLES = [
    {
        id: '1',
        title: 'Getting Started with Web Security',
        slug: 'getting-started-web-security',
        excerpt: 'Learn the fundamentals of web application security and common vulnerabilities.',
        category: 'Web Security',
        status: 'PUBLISHED',
        readTime: '5 min read',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        coverType: 'gradient',
    },
    {
        id: '2',
        title: 'Understanding SQL Injection Attacks',
        slug: 'understanding-sql-injection',
        excerpt: 'A deep dive into SQL injection vulnerabilities and how to prevent them.',
        category: 'Database Security',
        status: 'PUBLISHED',
        readTime: '8 min read',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        coverType: 'gradient',
    },
    {
        id: '3',
        title: 'API Security Best Practices',
        slug: 'api-security-best-practices',
        excerpt: 'Essential security measures for protecting your REST and GraphQL APIs.',
        category: 'API Security',
        status: 'DRAFT',
        readTime: '6 min read',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        coverType: 'gradient',
    },
    {
        id: '4',
        title: 'Authentication Patterns in Modern Apps',
        slug: 'authentication-patterns',
        excerpt: 'Exploring OAuth, JWT, and session-based authentication strategies.',
        category: 'Authentication',
        status: 'PENDING_REVIEW',
        readTime: '10 min read',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        coverType: 'gradient',
    },
    {
        id: '5',
        title: 'Secure Coding Guidelines',
        slug: 'secure-coding-guidelines',
        excerpt: 'Best practices for writing secure code in JavaScript and TypeScript.',
        category: 'Development',
        status: 'DRAFT',
        readTime: '7 min read',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        coverType: 'gradient',
    },
    {
        id: '6',
        title: 'Container Security Fundamentals',
        slug: 'container-security',
        excerpt: 'Securing Docker containers and Kubernetes deployments.',
        category: 'DevOps',
        status: 'PUBLISHED',
        readTime: '9 min read',
        gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        coverType: 'gradient',
    },
]

export function UserArticlesSection() {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session } = useSession()
    const [articles, setArticles] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [stats, setStats] = useState({ published: 0, drafts: 0 })
    const [useMockData, setUseMockData] = useState(false)

    const isDemo = pathname?.includes('/demo')
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const fetchArticles = async (page = 1) => {
        // Only use mock data on demo routes
        if (isDemo) {
            setUseMockData(true)
            const start = (page - 1) * ITEMS_PER_PAGE
            const paginatedMock = MOCK_ARTICLES.slice(start, start + ITEMS_PER_PAGE)
            setArticles(paginatedMock)
            setTotalCount(MOCK_ARTICLES.length)
            setStats({
                published: MOCK_ARTICLES.filter(a => a.status === 'PUBLISHED').length,
                drafts: MOCK_ARTICLES.filter(a => a.status === 'DRAFT').length
            })
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
            const response = await fetch(`/api/articles?limit=${ITEMS_PER_PAGE}&skip=${skip}`)
            if (response.ok) {
                const data = await response.json()
                setUseMockData(false)
                setArticles(data.articles || [])
                setTotalCount(data.total || 0)
                setStats({
                    published: data.publishedCount || 0,
                    drafts: data.draftCount || 0
                })
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchArticles(currentPage)
    }, [session, currentPage, isDemo])

    return (
        <Card className="border-border/50 transition-shadow hover:shadow-md">
            <CardHeader className="pb-3 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                        </div>
                        <div>
                            <CardTitle className="text-base sm:text-lg">Your articles</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {stats.published} published
                                </Badge>
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5">
                                    {stats.drafts} drafts
                                </Badge>
                                {useMockData && <span className="text-[9px] text-muted-foreground/60">(demo)</span>}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard?tab=write')}
                        className="gap-1.5 w-full sm:w-auto"
                    >
                        <PenLine className="h-3.5 w-3.5" />
                        Write article
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : articles.length === 0 && currentPage === 1 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="rounded-full bg-primary/10 p-4 mb-3 ring-4 ring-primary/5">
                            <PenLine className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm font-semibold">No articles yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                            Start writing to share your security knowledge and insights with the community.
                        </p>
                        <Button
                            size="sm"
                            className="mt-4 gap-1.5"
                            onClick={() => router.push('/dashboard?tab=write')}
                        >
                            <PenLine className="h-3.5 w-3.5" />
                            Create your first article
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="h-[320px] sm:h-[300px]">
                            <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border/50 hover:bg-muted/30 hover:border-primary/20 transition-all duration-150 cursor-pointer select-none"
                                        onClick={() => {
                                            if (article.status === 'PUBLISHED') {
                                                router.push(`/blog/${article.slug}`)
                                            } else {
                                                router.push('/dashboard?tab=write')
                                            }
                                        }}
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
                                                <Badge
                                                    variant="outline"
                                                    className={`shrink-0 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 ${STATUS_COLORS[article.status] || ''}`}
                                                >
                                                    {STATUS_LABELS[article.status] || article.status}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {article.excerpt || 'No excerpt'}
                                            </p>
                                            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                                                {article.readTime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        {article.readTime}
                                                    </span>
                                                )}
                                                {article.status === 'PUBLISHED' && (
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        Live
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center" />
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

export default UserArticlesSection
