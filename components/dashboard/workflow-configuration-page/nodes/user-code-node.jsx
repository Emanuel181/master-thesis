"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { Code } from "lucide-react";

/**
 * User Code Node component for the workflow visualization
 */
export function UserCodeNode({ data }) {
    return (
        <>
            <Card className="min-w-[220px] shadow-lg border-2 border-yellow-400 dark:border-yellow-400">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-yellow-400">
                            <Code className="w-7 h-7 text-gray-900" strokeWidth={2.5} />
                        </div>
                        <div className="font-semibold text-base">{data.label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {data.description}
                    </div>
                </CardContent>
            </Card>
            <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />
        </>
    );
}

