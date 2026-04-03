"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { Code, ArrowRight } from "lucide-react";

/**
 * User Code Node component for the workflow visualization
 */
export function UserCodeNode({ data }) {
    return (
        <>
            <Card className="w-[180px] sm:w-[220px] shadow-lg border-2 border-primary relative overflow-hidden">
                {/* Animated gradient border shimmer */}
                <div className="absolute inset-0 pointer-events-none"
                     style={{
                         background: 'linear-gradient(90deg, transparent, hsl(var(--accent)/0.08), transparent)',
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 3s ease-in-out infinite'
                     }} />
                <CardContent className="p-2 sm:p-4 relative">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="p-2 sm:p-3 rounded-lg bg-primary">
                            <Code className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="font-semibold text-xs sm:text-base">{data.label}</div>
                            <div className="text-[9px] sm:text-[10px] text-primary font-medium">Input</div>
                        </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                        {data.description}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                        <ArrowRight className="h-2.5 w-2.5" />
                        <span>Flows to Reviewer agent</span>
                    </div>
                </CardContent>
            </Card>
            <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />
        </>
    );
}

