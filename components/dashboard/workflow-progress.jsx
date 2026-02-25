"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    Shield,
    FileCode,
    TestTube2,
    FileText,
    Wifi,
    WifiOff,
} from "lucide-react";
import { useWorkflowWebSocket, WS_STATE, WORKFLOW_EVENTS } from "@/hooks/use-workflow-websocket";

/**
 * Agent icons mapping
 */
const AGENT_ICONS = {
    reviewer: Shield,
    implementer: FileCode,
    tester: TestTube2,
    reporter: FileText,
};

/**
 * Event type to display mapping
 */
const EVENT_DISPLAY = {
    [WORKFLOW_EVENTS.RUN_STARTED]: { label: 'Run Started', color: 'text-primary' },
    [WORKFLOW_EVENTS.USE_CASE_STARTED]: { label: 'Use Case Started', color: 'text-primary' },
    [WORKFLOW_EVENTS.USE_CASE_COMPLETED]: { label: 'Use Case Completed', color: 'text-success' },
    [WORKFLOW_EVENTS.AGENT_STARTED]: { label: 'Agent Started', color: 'text-agent-report' },
    [WORKFLOW_EVENTS.AGENT_COMPLETED]: { label: 'Agent Completed', color: 'text-success' },
    [WORKFLOW_EVENTS.VULNERABILITY_FOUND]: { label: 'Vulnerability Found', color: 'text-severity-high' },
    [WORKFLOW_EVENTS.RUN_COMPLETED]: { label: 'Run Completed', color: 'text-success' },
    [WORKFLOW_EVENTS.RUN_FAILED]: { label: 'Run Failed', color: 'text-destructive' },
};

/**
 * Connection Status Badge
 */
function ConnectionStatus({ status }) {
    const statusConfig = {
        [WS_STATE.CONNECTED]: { icon: Wifi, label: 'Connected', variant: 'success' },
        [WS_STATE.CONNECTING]: { icon: Loader2, label: 'Connecting...', variant: 'default', animate: true },
        [WS_STATE.RECONNECTING]: { icon: Loader2, label: 'Reconnecting...', variant: 'warning', animate: true },
        [WS_STATE.DISCONNECTED]: { icon: WifiOff, label: 'Disconnected', variant: 'secondary' },
        [WS_STATE.ERROR]: { icon: XCircle, label: 'Error', variant: 'destructive' },
    };

    const config = statusConfig[status] || statusConfig[WS_STATE.DISCONNECTED];
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
            {config.label}
        </Badge>
    );
}

/**
 * Event Log Item
 */
function EventLogItem({ event }) {
    const display = EVENT_DISPLAY[event.type] || { label: event.type, color: 'text-muted-foreground' };
    const time = new Date(event.receivedAt).toLocaleTimeString();

    return (
        <div className="flex items-start gap-3 py-2 border-b last:border-b-0">
            <span className="text-xs text-muted-foreground w-[70px] shrink-0">
                {time}
            </span>
            <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${display.color}`}>
                    {display.label}
                </span>
                {event.detail && (
                    <p className="text-xs text-muted-foreground truncate">
                        {event.detail.useCaseTitle || event.detail.agentType || event.detail.error || ''}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Agent Progress Card
 */
function AgentProgressCard({ agentType, status, isActive }) {
    const Icon = AGENT_ICONS[agentType] || Shield;
    const agentNames = {
        reviewer: 'Security Reviewer',
        implementer: 'Fix Implementer',
        tester: 'Test Generator',
        reporter: 'Report Generator',
    };

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border",
            isActive && "border-primary bg-primary/5",
            !isActive && status === 'completed' && "border-success/30 bg-success/5",
            !isActive && status !== 'completed' && "border-muted"
        )}>
            <div className={cn(
                "p-2 rounded-lg",
                isActive && "bg-primary/10",
                !isActive && status === 'completed' && "bg-success/10",
                !isActive && status !== 'completed' && "bg-muted"
            )}>
                {isActive ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1">
                <p className="font-medium text-sm">{agentNames[agentType] || agentType}</p>
                <p className="text-xs text-muted-foreground">
                    {isActive ? 'Processing...' : status === 'completed' ? 'Completed' : 'Waiting'}
                </p>
            </div>
        </div>
    );
}

/**
 * Real-time Workflow Progress Component
 */
export function WorkflowProgress({
    runId,
    onComplete,
    onError,
}) {
    const {
        status,
        events,
        progress,
        error,
        connect,
        disconnect,
        isConnected,
        isConnecting,
    } = useWorkflowWebSocket({
        runId,
        autoConnect: true,
        onEvent: (event) => {
            if (event.type === WORKFLOW_EVENTS.RUN_COMPLETED) {
                onComplete?.(event.detail);
            } else if (event.type === WORKFLOW_EVENTS.RUN_FAILED) {
                onError?.(event.detail?.error);
            }
        },
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Workflow Progress</CardTitle>
                    <div className="flex items-center gap-2">
                        <ConnectionStatus status={status} />
                        {!isConnected && !isConnecting && (
                            <Button variant="outline" size="sm" onClick={connect}>
                                Reconnect
                            </Button>
                        )}
                        {isConnected && progress.percentage < 100 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this run?')) {
                                        onError?.('Cancelled by user');
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <div className="flex items-center gap-3">
                            {progress.percentage > 0 && progress.percentage < 100 && progress.totalUseCases > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    ~{Math.max(1, Math.round(((100 - progress.percentage) / Math.max(progress.percentage, 1)) * (events.length > 0 ? 10 : 30)))}s remaining
                                </span>
                            )}
                            <span className="font-medium">{progress.percentage}%</span>
                        </div>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            {progress.completedUseCases} / {progress.totalUseCases} use cases completed
                        </span>
                        <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-severity-high" />
                            {progress.vulnerabilitiesFound} vulnerabilities found
                        </span>
                    </div>
                </div>

                {/* Current Status */}
                {progress.currentUseCase && (
                    <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">Currently analyzing:</p>
                        <p className="font-medium">{progress.currentUseCase}</p>
                        {progress.currentAgent && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Agent: <span className="capitalize">{progress.currentAgent}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Agent Pipeline */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Agent Pipeline</p>
                    <div className="grid grid-cols-2 gap-2">
                        {['reviewer', 'implementer', 'tester', 'reporter'].map((agentType, idx) => {
                            const agentOrder = ['reviewer', 'implementer', 'tester', 'reporter'];
                            const currentIdx = agentOrder.indexOf(progress.currentAgent);
                            const isActive = progress.currentAgent === agentType;
                            const isCompleted = currentIdx > idx || progress.percentage === 100;
                            return (
                                <AgentProgressCard
                                    key={agentType}
                                    agentType={agentType}
                                    status={isCompleted ? 'completed' : isActive ? 'active' : 'pending'}
                                    isActive={isActive}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">Error</span>
                        </div>
                        <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                )}

                {/* Event Log */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Event Log</p>
                    <ScrollArea className="h-[200px] rounded-lg border">
                        <div className="p-2">
                            {events.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    Waiting for events...
                                </p>
                            ) : (
                                events.slice().reverse().map((event, index) => (
                                    <EventLogItem key={index} event={event} />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

export default WorkflowProgress;
