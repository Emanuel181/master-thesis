"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Search,
    MoreVertical,
    Filter,
    Lock,
    LockOpen,
    Globe,
    X,
} from "lucide-react";

/**
 * HTTP Method colors
 */
const METHOD_COLORS = {
    GET: "bg-success text-primary-foreground",
    POST: "bg-primary text-primary-foreground",
    PUT: "bg-severity-medium text-primary-foreground",
    PATCH: "bg-severity-high text-primary-foreground",
    DELETE: "bg-destructive text-destructive-foreground",
    OPTIONS: "bg-muted-foreground text-primary-foreground",
    HEAD: "bg-agent-report text-primary-foreground",
};

/**
 * Endpoint Row Component
 */
function EndpointRow({ endpoint, onClick }) {
    const methodColor = METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET;

    return (
        <div
            onClick={() => onClick?.(endpoint)}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors group"
        >
            {/* Method */}
            <Badge className={`${methodColor} font-mono text-xs min-w-15 justify-center`}>
                {endpoint.method}
            </Badge>

            {/* Endpoint Path */}
            <div className="flex-1 font-mono text-sm flex items-center gap-2">
                <span className="truncate">{endpoint.path}</span>
                {endpoint.vulnCount > 0 && (
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                                    {endpoint.vulnCount}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>{endpoint.vulnCount} {endpoint.vulnCount === 1 ? 'vulnerability' : 'vulnerabilities'}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {/* Authentication */}
            <div className="w-[140px] hidden md:block">
                <Badge
                    variant="outline"
                    className={`text-xs ${
                        endpoint.requiresAuth
                            ? 'border-success/30 text-success'
                            : 'border-severity-medium/30 text-severity-medium'
                    }`}
                >
                    {endpoint.requiresAuth ? (
                        <>
                            <Lock className="h-3 w-3 mr-1" />
                            required
                        </>
                    ) : (
                        <>
                            <LockOpen className="h-3 w-3 mr-1" />
                            optional
                        </>
                    )}
                </Badge>
            </div>

            {/* Dependencies */}
            <div className="w-[100px] text-center text-sm text-muted-foreground hidden lg:block">
                {endpoint.dependencies || 0}
            </div>

            {/* Parameters */}
            <div className="w-[100px] text-center text-sm text-muted-foreground hidden lg:block">
                {endpoint.parameters || 0}
            </div>

            {/* Tag */}
            <div className="w-[120px] hidden sm:block">
                <Badge variant="secondary" className="text-xs">
                    {endpoint.tag || endpoint.category || 'general'}
                </Badge>
            </div>

            {/* Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Test Endpoint</DropdownMenuItem>
                    <DropdownMenuItem>View Vulnerabilities</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * Endpoints View Component
 */
export function EndpointsView({ endpoints: initialEndpoints = [] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [authFilter, setAuthFilter] = useState(false); // true = show only auth-required
    const searchRef = useRef(null);

    // Keyboard shortcut: / to focus search
    useEffect(() => {
        const handler = (e) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                const tag = document.activeElement?.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault();
                    searchRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Generate sample endpoints if none provided
    const endpoints = useMemo(() => {
        if (initialEndpoints.length > 0) return initialEndpoints;

        return [
            { method: "GET", path: "/icons", requiresAuth: false, dependencies: 0, parameters: 0, tag: "icons" },
            { method: "GET", path: "/health", requiresAuth: false, dependencies: 0, parameters: 0, tag: "health" },
            { method: "GET", path: "/articles/[id]/content", requiresAuth: false, dependencies: 0, parameters: 0, tag: "articles" },
            { method: "PUT", path: "/articles/[id]/content", requiresAuth: false, dependencies: 0, parameters: 0, tag: "articles" },
            { method: "POST", path: "/format-code", requiresAuth: false, dependencies: 0, parameters: 0, tag: "format-code" },
            { method: "POST", path: "/detect-language", requiresAuth: false, dependencies: 0, parameters: 0, tag: "detect-language" },
            { method: "GET", path: "/prompts", requiresAuth: false, dependencies: 0, parameters: 0, tag: "prompts" },
            { method: "POST", path: "/prompts", requiresAuth: true, dependencies: 0, parameters: 2, tag: "prompts" },
            { method: "GET", path: "/api/use-cases", requiresAuth: true, dependencies: 1, parameters: 0, tag: "use-cases" },
            { method: "POST", path: "/api/use-cases", requiresAuth: true, dependencies: 1, parameters: 3, tag: "use-cases" },
            { method: "DELETE", path: "/api/use-cases/[id]", requiresAuth: true, dependencies: 1, parameters: 1, tag: "use-cases" },
            { method: "GET", path: "/api/workflow/start", requiresAuth: true, dependencies: 2, parameters: 1, tag: "workflow" },
            { method: "POST", path: "/api/workflow/start", requiresAuth: true, dependencies: 3, parameters: 5, tag: "workflow" },
            { method: "GET", path: "/api/analytics", requiresAuth: true, dependencies: 1, parameters: 1, tag: "analytics" },
            { method: "GET", path: "/api/api-keys", requiresAuth: true, dependencies: 1, parameters: 0, tag: "api-keys" },
            { method: "POST", path: "/api/api-keys", requiresAuth: true, dependencies: 1, parameters: 3, tag: "api-keys" },
            { method: "DELETE", path: "/api/api-keys/[id]", requiresAuth: true, dependencies: 1, parameters: 1, tag: "api-keys" },
        ];
    }, [initialEndpoints]);

    // Get unique tags
    const tags = useMemo(() => {
        const tagSet = new Set(endpoints.map(e => e.tag || 'general'));
        return ['all', ...Array.from(tagSet)];
    }, [endpoints]);

    // Active filters count
    const activeFiltersCount = (methodFilter !== 'all' ? 1 : 0) + (tagFilter !== 'all' ? 1 : 0) + (authFilter ? 1 : 0);

    // Clear all filters
    const clearAllFilters = () => {
        setMethodFilter('all');
        setTagFilter('all');
        setAuthFilter(false);
        setSearchQuery('');
    };

    // Filter endpoints
    const filteredEndpoints = useMemo(() => {
        return endpoints.filter(endpoint => {
            if (searchQuery && !endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (methodFilter !== 'all' && endpoint.method !== methodFilter) return false;
            if (tagFilter !== 'all' && endpoint.tag !== tagFilter) return false;
            if (authFilter && !endpoint.requiresAuth) return false;
            return true;
        });
    }, [endpoints, searchQuery, methodFilter, tagFilter, authFilter]);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                placeholder={`Search ${endpoints.length} endpoints...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-10"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border pointer-events-none">/</kbd>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Filter className="h-3.5 w-3.5" />
                                    Method
                                    {methodFilter !== 'all' && (
                                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{methodFilter}</Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setMethodFilter('all')}>
                                    All Methods
                                </DropdownMenuItem>
                                {Object.keys(METHOD_COLORS).map(method => (
                                    <DropdownMenuItem
                                        key={method}
                                        onClick={() => setMethodFilter(method)}
                                    >
                                        <Badge className={`${METHOD_COLORS[method]} mr-2 text-[10px]`}>{method}</Badge>
                                        {method}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Filter className="h-3.5 w-3.5" />
                                    Tags
                                    {tagFilter !== 'all' && (
                                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{tagFilter}</Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {tags.map(tag => (
                                    <DropdownMenuItem
                                        key={tag}
                                        onClick={() => setTagFilter(tag)}
                                    >
                                        {tag === 'all' ? 'All Tags' : tag}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex items-center gap-2">
                            <Switch id="auth-filter" checked={authFilter} onCheckedChange={setAuthFilter} />
                            <Label htmlFor="auth-filter" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                                Auth required
                            </Label>
                        </div>
                    </div>

                    {/* Active filter badges */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Filters:</span>
                            {methodFilter !== 'all' && (
                                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                                    {methodFilter}
                                    <button onClick={() => setMethodFilter('all')} className="ml-0.5 hover:bg-background/50 rounded-full p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {tagFilter !== 'all' && (
                                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                                    {tagFilter}
                                    <button onClick={() => setTagFilter('all')} className="ml-0.5 hover:bg-background/50 rounded-full p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {authFilter && (
                                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                                    Auth required
                                    <button onClick={() => setAuthFilter(false)} className="ml-0.5 hover:bg-background/50 rounded-full p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs px-2">
                                Clear all
                            </Button>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {filteredEndpoints.length} of {endpoints.length} endpoints
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Table Header */}
                <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
                    <div className="w-[60px]">Method</div>
                    <div className="flex-1">Endpoint</div>
                    <div className="w-[140px] hidden md:block">Authentication</div>
                    <div className="w-[100px] text-center hidden lg:block">Dependencies</div>
                    <div className="w-[100px] text-center hidden lg:block">Parameters</div>
                    <div className="w-[120px] hidden sm:block">Tag</div>
                    <div className="w-[40px]"></div>
                </div>

                <ScrollArea className="h-[32rem]">
                    {filteredEndpoints.map((endpoint, index) => (
                        <EndpointRow
                            key={`${endpoint.method}-${endpoint.path}-${index}`}
                            endpoint={endpoint}
                            onClick={() => {}}
                        />
                    ))}
                    {filteredEndpoints.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            {searchQuery || activeFiltersCount > 0 ? (
                                <>
                                    <Search className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-base font-medium">No matching endpoints</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Try adjusting your search or filters
                                    </p>
                                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-4">
                                        Clear all filters
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-base font-medium">No endpoints detected</p>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                        API endpoints will be discovered during the security scan. Run a scan to populate this view.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default EndpointsView;
