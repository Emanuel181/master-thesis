"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconCircleCheckFilled,
    IconDotsVertical,
    IconGripVertical,
    IconLayoutColumns,
    IconLoader,
    IconTrendingUp,
} from "@tabler/icons-react"
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getExpandedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronRightIcon, Download, Eye, EyeOff, Lock, Copy, Check, Fingerprint, ShieldCheck, KeyRound, Search, ShieldAlert, Activity } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FixReview } from "@/components/dashboard/fix-review/fix-review"
import { FileAnalysisView } from "@/components/dashboard/results-page/file-analysis-view"
import { AttackPathGraph } from "@/components/dashboard/results-page/attack-path-graph"
import { DebatePanel } from "@/components/dashboard/results-page/debate-panel"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { UNDERLINE_TAB as UNDERLINE_TAB_TRIGGER } from "@/lib/tab-variants"

export const schema = z.object({
    id: z.number(),
    severity: z.string(),
    title: z.string(),
    type: z.string(),
    details: z.string(),
    fileName: z.string(),
    cweId: z.string().optional(),
    vulnerableCode: z.string().optional(),
    explanation: z.string().optional(),
    bestPractices: z.string().optional(),
    exploitExamples: z.string().optional(),
    tasks: z.array(z.object({
        id: z.string(),
        name: z.string(),
        assignee: z.string(),
        status: z.string(),
    })).optional(),
})

// No sample data - will use data from props

const severityColors = {
    "Critical": "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
    "High": "bg-severity-high/10 text-severity-high border-severity-high/30",
    "Medium": "bg-severity-medium/10 text-severity-medium border-severity-medium/30",
    "Low": "bg-severity-low/10 text-severity-low border-severity-low/30"
}

// Create a separate component for the drag handle

// Create a separate component for the drag handle
function DragHandle({ id }) {
    const { attributes, listeners } = useSortable({
        id,
    })

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7 hover:bg-transparent"
        >
            <IconGripVertical className="text-muted-foreground size-3" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    )
}

/**
 * TitleCell - Extracted as a proper React component so hooks can be used legally.
 */
function TitleCell({ row }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [drawerWidth, setDrawerWidth] = React.useState(500)
    const [isResizing, setIsResizing] = React.useState(false)
    const startXRef = React.useRef(0)
    const startWidthRef = React.useRef(0)

    const handleMouseDown = (e) => {
        setIsResizing(true)
        startXRef.current = e.clientX
        startWidthRef.current = drawerWidth
        e.preventDefault()
        e.stopPropagation()
    }

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return

            const deltaX = startXRef.current - e.clientX
            const newWidth = startWidthRef.current + deltaX

            if (newWidth >= 300 && newWidth <= window.innerWidth * 0.9) {
                setDrawerWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, drawerWidth])

    return (
        <>
            <Button
                variant="link"
                className="text-foreground font-medium px-0 text-left h-auto"
                onClick={() => setIsOpen(true)}
            >
                {row.original.title}
            </Button>

            {isOpen && typeof window !== 'undefined' && ReactDOM.createPortal(
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-black/50 z-[9998]"
                                onClick={() => !isResizing && setIsOpen(false)}
                            />

                            {/* Floating Resize Handle - Outside drawer */}
                            <div
                                onMouseDown={handleMouseDown}
                                className="fixed top-1/2 -translate-y-1/2 z-[10000] cursor-col-resize group"
                                style={{
                                    touchAction: 'none',
                                    right: `${drawerWidth + 16}px`,
                                    transition: isResizing ? 'none' : 'right 0.2s ease-out'
                                }}
                            >
                                <div className={`
                                    w-12 h-20 rounded-full 
                                    bg-background border-2 
                                    flex items-center justify-center
                                    shadow-lg hover:shadow-xl
                                    ${isResizing
                                        ? 'border-primary'
                                        : 'border-border hover:border-primary/50 transition-all duration-200'
                                    }
                                `}>
                                    <div className="flex gap-1">
                                        <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizing ? 'bg-primary' : 'bg-muted-foreground/50 group-hover:bg-primary/70'
                                            }`}></div>
                                        <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizing ? 'bg-primary' : 'bg-muted-foreground/50 group-hover:bg-primary/70'
                                            }`}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Resizable Drawer */}
                            <div
                                className="fixed top-0 right-0 h-screen bg-background border-l shadow-xl z-[9999] flex flex-col"
                                style={{ width: `${drawerWidth}px` }}
                            >

                                <ScrollArea className="flex-1">
                                    <div className="flex flex-col h-full">
                                        {/* Header Section */}
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h2 className="text-2xl font-bold">{row.original.title}</h2>
                                                <p className="text-sm text-muted-foreground mt-1">{row.original.cweId || row.original.type || '—'}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Severity:</span>
                                                    <Badge variant="outline" className={`px-2 py-1 ${row.original.severity === "Critical" ? severityColors["Critical"] :
                                                        row.original.severity === "High" ? severityColors["High"] :
                                                            row.original.severity === "Medium" ? severityColors["Medium"] :
                                                                severityColors["Low"]
                                                        }`}>
                                                        {row.original.severity}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">File:</span>
                                                    <code className="text-sm bg-muted px-2 py-0.5 rounded">
                                                        {row.original.fileName}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>

                                        <Tabs defaultValue="description" className="w-full gap-4">
                                            <TabsList className="w-full bg-transparent rounded-none border-b p-0">
                                                <TabsTrigger value="description" className={UNDERLINE_TAB_TRIGGER}>
                                                    Description
                                                </TabsTrigger>
                                                <TabsTrigger value="references" className={UNDERLINE_TAB_TRIGGER}>
                                                    References
                                                    {row.original.documentReferences && row.original.documentReferences.length > 0 && (
                                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                                            {row.original.documentReferences.length}
                                                        </span>
                                                    )}
                                                </TabsTrigger>
                                                <TabsTrigger value="exploit" className={UNDERLINE_TAB_TRIGGER}>
                                                    Exploit
                                                </TabsTrigger>
                                                <TabsTrigger value="debate" className={UNDERLINE_TAB_TRIGGER}>
                                                    Multi-agent debate mode
                                                </TabsTrigger>
                                                <TabsTrigger value="attack-path" className={UNDERLINE_TAB_TRIGGER}>
                                                    Attack path visualization
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="description" className="p-6">
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <h3 className="text-sm font-semibold">Vulnerable Code</h3>
                                                        <div className="rounded-md bg-muted p-4">
                                                            <pre className="text-sm overflow-x-auto">
                                                                <code>{row.original.vulnerableCode || row.original.details}</code>
                                                            </pre>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h3 className="text-sm font-semibold">Explanation</h3>
                                                        <div className="text-sm text-muted-foreground">
                                                            <p>{row.original.explanation || row.original.details}</p>
                                                        </div>
                                                    </div>

                                                    {row.original.bestPractices && (
                                                        <div className="space-y-2">
                                                            <h3 className="text-sm font-semibold">Framework-Specific Best Practices</h3>
                                                            <div className="text-sm text-muted-foreground">
                                                                <p>{row.original.bestPractices}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="references" className="p-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="text-sm font-semibold mb-2">Knowledge Base References</h3>
                                                        <p className="text-sm text-muted-foreground mb-4">
                                                            Documents from your knowledge base that support this finding.
                                                        </p>
                                                    </div>
                                                    {row.original.documentReferences && row.original.documentReferences.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {row.original.documentReferences.map((ref, index) => (
                                                                <div key={index} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${ref.confidence === 'high' ? 'bg-success/10 text-success' :
                                                                                ref.confidence === 'medium' ? 'bg-primary/10 text-primary' :
                                                                                    'bg-muted text-muted-foreground'
                                                                                }`}>
                                                                                {index + 1}
                                                                            </div>
                                                                            <span className="font-medium text-sm">{ref.documentTitle}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {ref.confidence && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`text-xs ${ref.confidence === 'high' ? 'border-success/30 text-success' :
                                                                                        ref.confidence === 'medium' ? 'border-primary/50 text-primary' :
                                                                                            ref.confidence === 'suggested' ? 'border-severity-medium/30 text-severity-medium' :
                                                                                                ''
                                                                                        }`}
                                                                                >
                                                                                    {ref.confidence === 'high' ? 'Cited' :
                                                                                        ref.confidence === 'medium' ? 'Matched' :
                                                                                            ref.confidence === 'suggested' ? 'Suggested' :
                                                                                                'Related'}
                                                                                </Badge>
                                                                            )}
                                                                            {ref.relevanceScore && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    {Math.round(ref.relevanceScore * 100)}% match
                                                                                </Badge>
                                                                            )}
                                                                            {ref.documentId && !ref.confidence && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {ref.documentId}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {ref.relevantExcerpt && (
                                                                        <div className="pl-8">
                                                                            <blockquote className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground italic">
                                                                                &ldquo;{ref.relevantExcerpt}&rdquo;
                                                                            </blockquote>
                                                                        </div>
                                                                    )}
                                                                    {ref.source === 'post-processed' && (
                                                                        <div className="pl-8">
                                                                            <p className="text-xs text-muted-foreground/70">
                                                                                Auto-matched based on vulnerability type and keywords
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <p className="text-sm">No document references available for this finding.</p>
                                                            <p className="text-xs mt-1">Select PDF documents in workflow configuration to enable RAG-based references.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="exploit" className="p-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="text-sm font-semibold mb-2">Exploit Examples</h3>
                                                        <p className="text-sm text-muted-foreground mb-4">
                                                            {row.original.exploitExamples || 'No exploit examples available for this vulnerability.'}
                                                        </p>
                                                    </div>
                                                    {row.original.attackPath && (
                                                        <div className="space-y-2">
                                                            <h3 className="text-sm font-semibold">Attack Scenario</h3>
                                                            <div className="rounded-md bg-muted p-4">
                                                                <pre className="text-sm whitespace-pre-wrap">{row.original.attackPath}</pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="debate" className="p-6">
                                                <DebatePanel
                                                    vulnerabilityId={row.original.id}
                                                    debateLog={row.original.debateLog}
                                                />
                                            </TabsContent>
                                            <TabsContent value="attack-path" className="p-6">
                                                <AttackPathGraph
                                                    dataFlow={row.original.dataFlow}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </ScrollArea>
                            </div>
                        </>,
                        document.body
                    )}
                </>
    )
}

const columns = [
    {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
            return row.original.tasks ? (
                <Button
                    className="h-8 w-8 p-0"
                    onClick={() => row.toggleExpanded()}
                    size="sm"
                    variant="ghost"
                >
                    {row.getIsExpanded() ? (
                        <ChevronDownIcon className="size-4" />
                    ) : (
                        <ChevronRightIcon className="size-4" />
                    )}
                </Button>
            ) : null
        },
        size: 50,
        enableResizing: false,
    },
    {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => {
            const severity = row.original.severity
            return (
                <Badge variant="outline" className={`px-2 py-1 ${severityColors[severity] || ""}`}>
                    {severity}
                </Badge>
            )
        },
        size: 120,
        minSize: 80,
        maxSize: 200,
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <TitleCell row={row} />,
        enableHiding: false,
        size: 250,
        minSize: 150,
        maxSize: 500,
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
            <Badge variant="outline" className="text-muted-foreground px-1.5">
                {row.original.type}
            </Badge>
        ),
        size: 120,
        minSize: 80,
        maxSize: 200,
    },
    {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => (
            <div className="max-w-md truncate text-sm text-muted-foreground">
                {row.original.details}
            </div>
        ),
        size: 300,
        minSize: 150,
        maxSize: 600,
    },
    {
        accessorKey: "fileName",
        header: "File Name",
        cell: ({ row }) => (
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                {row.original.fileName}
            </code>
        ),
        size: 150,
        minSize: 100,
        maxSize: 300,
    },
    {
        id: "actions",
        cell: () => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        size="icon"
                    >
                        <IconDotsVertical />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem>
                        Fix this
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        size: 60,
        enableResizing: false,
    },
]

function DraggableRow({ row }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id,
    })

    return (
        <React.Fragment>
            <TableRow
                data-state={row.getIsSelected() && "selected"}
                data-dragging={isDragging}
                ref={setNodeRef}
                className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition: transition,
                }}
            >
                {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                ))}
            </TableRow>
            {row.getIsExpanded() && (
                <TableRow>
                    <TableCell colSpan={columns.length}>
                        <div className="rounded-md bg-muted/50 p-4">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Remediation Tasks</h4>
                                {row.original.tasks && row.original.tasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {row.original.tasks.map((task) => (
                                            <div key={task.id} className="flex items-center gap-3 text-sm">
                                                <Badge variant="outline" className="text-xs">
                                                    {task.status}
                                                </Badge>
                                                <span>{task.name}</span>
                                                <span className="text-muted-foreground">• {task.assignee}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No remediation tasks defined yet</p>
                                )}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    )
}

export function DataTable({
    data: initialData = [],
    runId,
}) {
    const [data, setData] = React.useState(() => initialData)
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState({})
    const [columnFilters, setColumnFilters] = React.useState([])
    const [sorting, setSorting] = React.useState([])
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [severityFilter, setSeverityFilter] = React.useState([])
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [mounted, setMounted] = React.useState(false)

    // Update data when initialData changes
    React.useEffect(() => {
        setData(initialData)
    }, [initialData])

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const sortableId = React.useId()
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const dataIds = React.useMemo(
        () => data?.map(({ id }) => id) || [],
        [data]
    )

    const [columnSizing, setColumnSizing] = React.useState({})

    // Apply severity filter
    React.useEffect(() => {
        if (severityFilter.length > 0) {
            table.getColumn('severity')?.setFilterValue(severityFilter)
        } else {
            table.getColumn('severity')?.setFilterValue(undefined)
        }
    }, [severityFilter])

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
            columnSizing,
            globalFilter,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        onColumnSizingChange: setColumnSizing,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: (row) => !!row.original.tasks,
    })

    const handleDragEnd = React.useCallback((event) => {
        const { active, over } = event

        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = dataIds.indexOf(active.id)
                const newIndex = dataIds.indexOf(over.id)
                return arrayMove(data, oldIndex, newIndex)
            })
        }
    }, [dataIds])

    // Reusable table + pagination block
    const VulnerabilityTableContent = React.useCallback(({ idSuffix = "" }) => (
        <div className="relative flex flex-col gap-4 overflow-auto">
            <div className="w-full overflow-hidden rounded-lg border">
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId + idSuffix}
                >
                    <div className="w-full overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className="relative"
                                                style={{ width: header.getSize() }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.getCanResize() && (
                                                    <div
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${header.column.getIsResizing()
                                                            ? 'bg-primary opacity-100'
                                                            : 'bg-border opacity-0 hover:opacity-100'
                                                            } transition-opacity`}
                                                    />
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    <SortableContext
                                        items={dataIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {table.getRowModel().rows.map((row) => (
                                            <DraggableRow key={row.id} row={row} />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-40 text-center"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex flex-col items-center gap-3 py-8"
                                            >
                                                <motion.div
                                                    animate={{ y: [0, -4, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                                    className="rounded-full bg-gradient-to-br from-emerald-500/10 to-primary/10 p-4 ring-4 ring-emerald-500/5"
                                                >
                                                    <ShieldCheck className="h-7 w-7 text-emerald-500" />
                                                </motion.div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold">No vulnerabilities found</p>
                                                    <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                                                        Run a security scan or adjust your filters to see results here.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DndContext>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor={`rows-per-page${idSuffix}`} className="text-sm font-medium">
                            Rows per page
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger size="sm" className="w-20" id={`rows-per-page${idSuffix}`}>
                                <SelectValue
                                    placeholder={table.getState().pagination.pageSize}
                                />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[5, 10, 20, 30, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <IconChevronsLeft />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <IconChevronLeft />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <IconChevronRight />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <IconChevronsRight />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    ), [table, dataIds, handleDragEnd, sensors, sortableId])

    return (
        <Tabs
            defaultValue="all"
            className="w-full flex-col justify-start gap-6"
            onValueChange={(value) => {
                if (value === "critical") {
                    setSeverityFilter(["Critical"])
                } else if (value === "high") {
                    setSeverityFilter(["High"])
                } else if (value === "medium") {
                    setSeverityFilter(["Medium"])
                } else if (value === "low") {
                    setSeverityFilter(["Low"])
                } else {
                    setSeverityFilter([])
                }
            }}
        >
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-2.5">
                <Label htmlFor="view-selector" className="sr-only">
                    View
                </Label>
                <Select defaultValue="all">
                    <SelectTrigger
                        className="flex w-fit @4xl/main:hidden"
                        size="sm"
                        id="view-selector"
                    >
                        <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>

                <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="critical">
                        Critical <Badge variant="secondary" className={severityColors["Critical"]}>{mounted ? data.filter(d => d.severity === "Critical").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="high">
                        High <Badge variant="secondary" className={severityColors["High"]}>{mounted ? data.filter(d => d.severity === "High").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="medium">
                        Medium <Badge variant="secondary" className={severityColors["Medium"]}>{mounted ? data.filter(d => d.severity === "Medium").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="low">
                        Low <Badge variant="secondary" className={severityColors["Low"]}>{mounted ? data.filter(d => d.severity === "Low").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="fixes">
                        Fixes
                    </TabsTrigger>
                    <TabsTrigger value="files">
                        Files
                    </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                    {/* Search input */}
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search vulnerabilities..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="h-8 w-[180px] lg:w-[240px] pl-8 text-sm"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconLayoutColumns />
                                <span className="hidden lg:inline">Customize Columns</span>
                                <span className="lg:hidden">Columns</span>
                                <IconChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !== "undefined" &&
                                        column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <TabsContent value="all" className="mt-0">
                <VulnerabilityTableContent idSuffix="" />
            </TabsContent>

            <TabsContent value="critical" className="mt-0">
                <VulnerabilityTableContent idSuffix="-critical" />
            </TabsContent>

            <TabsContent value="high" className="mt-0">
                <VulnerabilityTableContent idSuffix="-high" />
            </TabsContent>

            <TabsContent value="medium" className="mt-0">
                <VulnerabilityTableContent idSuffix="-medium" />
            </TabsContent>

            <TabsContent value="low" className="mt-0">
                <VulnerabilityTableContent idSuffix="-low" />
            </TabsContent>

            <TabsContent
                value="fixes"
                className="relative flex flex-col h-full overflow-hidden mt-0"
            >
                <FixReview runId={runId} />
            </TabsContent>

            <TabsContent
                value="files"
                className="relative flex flex-col gap-4 overflow-auto mt-0"
            >
                <FileAnalysisView
                    vulnerabilities={data}
                    selectedFile={table.getColumn('fileName')?.getFilterValue() || null}
                    onFileSelect={(file) => {
                        if (file) {
                            table.getColumn('fileName')?.setFilterValue(file)
                        } else {
                            table.getColumn('fileName')?.setFilterValue(undefined)
                        }
                    }}
                />
            </TabsContent>
        </Tabs>
    )
}

export function Results({ initialCode: _initialCode, problems: _problems = [], generatedCode: _generatedCode = "", vulnerabilities: initialVulnerabilities = [], runId: propRunId, userId: _userId, demoMode = false }) {
    const [vulnerabilities, setVulnerabilities] = React.useState(initialVulnerabilities)
    const [progressValue, setProgressValue] = React.useState(demoMode ? 100 : 0)
    const [, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState(null)
    const [runId, setRunId] = React.useState(propRunId)
    const [isPolling, setIsPolling] = React.useState(!demoMode)
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)
    const [pdfPassword, setPdfPassword] = React.useState(null)
    const [showPdfPassword, setShowPdfPassword] = React.useState(false)
    const [copiedPassword, setCopiedPassword] = React.useState(false)
    const [pdfDownloaded, setPdfDownloaded] = React.useState(false)
    const [isAuthenticating, setIsAuthenticating] = React.useState(false)
    const [hasPasskey, setHasPasskey] = React.useState(false)
    const [, setPasskeyChecked] = React.useState(false)
    const [detailedStatus, setDetailedStatus] = React.useState({
        phase: demoMode ? 'completed' : 'initializing',
        message: demoMode ? `Complete — ${initialVulnerabilities.length} finding(s)` : '',
        steps: demoMode ? [
            { name: 'Reviewer Agent', status: 'completed' },
            { name: 'Implementation Agent', status: 'completed' },
            { name: 'Tester Agent', status: 'completed' },
            { name: 'Report Agent', status: 'completed' },
        ] : []
    })
    const [statusItems, setStatusItems] = React.useState(demoMode ? [
        { id: 1, name: 'Reviewer Agent', status: 'completed' },
        { id: 2, name: 'Implementation Agent', status: 'completed' },
        { id: 3, name: 'Tester Agent', status: 'completed' },
        { id: 4, name: 'Report Agent', status: 'completed' },
    ] : [])
    const completedRef = React.useRef(demoMode)

    // Get runId from localStorage if not provided as prop
    React.useEffect(() => {
        if (demoMode) return
        if (!propRunId && typeof window !== 'undefined') {
            const storedRunId = localStorage.getItem('vulniq_current_run_id')
            if (storedRunId) {
                setRunId(storedRunId)
            }
        }
    }, [propRunId, demoMode])

    // Check if user has a registered passkey for biometric unlock
    React.useEffect(() => {
        if (demoMode) { setPasskeyChecked(true); return }
        const controller = new AbortController()
        fetch('/api/user/passkey/status', { signal: controller.signal })
            .then(r => r.ok ? r.json() : { hasPasskey: false })
            .then(d => { setHasPasskey(d.hasPasskey); setPasskeyChecked(true) })
            .catch((err) => { if (err.name !== 'AbortError') setPasskeyChecked(true) })
        return () => controller.abort()
    }, [demoMode])

    // Set loading state when runId is available
    React.useEffect(() => {
        if (demoMode) return
        if (runId) {
            setIsLoading(true)
        }
    }, [runId, demoMode])

    // Fetch workflow data if runId is provided
    React.useEffect(() => {
        if (demoMode) return
        if (!runId) return

        const fetchWorkflowData = async () => {
            // Don't update if we've already detected completion
            if (completedRef.current) return;

            try {
                const response = await fetch(`/api/workflow/start?runId=${runId}`)
                if (!response.ok) {
                    // Stale or invalid runId — stop polling silently
                    setIsPolling(false)
                    setIsLoading(false)
                    return
                }

                const result = await response.json()

                if (result.success && result.data) {
                    const vulns = result.data.vulnerabilities || [];
                    const status = result.data.status;

                    setVulnerabilities(vulns)

                    // Check for completion: either backend says completed, or we have vulnerabilities
                    if (status === 'completed' || vulns.length > 0) {
                        completedRef.current = true;
                        setProgressValue(100);
                        setStatusItems(prev => prev.map(item => ({ ...item, status: "completed" })));
                        setDetailedStatus({
                            phase: 'completed',
                            message: result.data.detailedStatus?.message || `Complete — ${vulns.length} finding(s)`,
                            steps: result.data.detailedStatus?.steps?.map(s => ({ ...s, status: 'completed' })) || [],
                        });
                        setIsPolling(false);
                        setIsLoading(false);
                        return;
                    }

                    // Update detailed status for running state
                    if (result.data.detailedStatus) {
                        setDetailedStatus(result.data.detailedStatus)
                    }

                    const currentAgent = result.data.currentAgent
                    const agentProgress = result.data.agentProgress || 0


                    if (status === 'running') {
                        setProgressValue(agentProgress)

                        // Derive status items from the API's detailed steps
                        if (result.data.detailedStatus?.steps?.length > 0) {
                            setStatusItems(result.data.detailedStatus.steps.map((step, idx) => ({
                                id: idx + 1,
                                name: step.name,
                                status: step.status === 'running' ? 'executing'
                                    : step.status === 'completed' ? 'completed'
                                    : 'pending',
                            })))
                        }
                    } else if (status === 'failed') {
                        setError('Workflow execution failed')
                        setIsPolling(false)
                    }
                }
                setIsLoading(false)
            } catch (err) {
                console.error('Error fetching workflow data:', err)
                setError(err.message)
                setIsLoading(false)
            }
        }

        // Initial fetch
        fetchWorkflowData()

        // Poll for updates every 3 seconds only if workflow is running
        const interval = setInterval(() => {
            if (isPolling) {
                fetchWorkflowData()
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [runId, isPolling, demoMode])

    // Calculate vulnerability statistics from actual data
    const vulnerabilityStats = React.useMemo(() => {
        const stats = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0,
        }

        vulnerabilities.forEach(vuln => {
            const severity = vuln.severity
            if (stats.hasOwnProperty(severity)) {
                stats[severity]++
            }
        })

        return [
            { severity: "Critical", count: stats.Critical, color: "text-severity-critical" },
            { severity: "High", count: stats.High, color: "text-severity-high" },
            { severity: "Medium", count: stats.Medium, color: "text-severity-medium" },
            { severity: "Low", count: stats.Low, color: "text-severity-low" },
        ]
    }, [vulnerabilities])

    // Compute weighted risk score (0-100)
    const riskScore = React.useMemo(() => {
        if (vulnerabilities.length === 0) return 0
        const stats = { Critical: 0, High: 0, Medium: 0, Low: 0 }
        vulnerabilities.forEach(v => { if (stats.hasOwnProperty(v.severity)) stats[v.severity]++ })
        const rawScore = stats.Critical * 10 + stats.High * 5 + stats.Medium * 2 + stats.Low
        const maxPossible = vulnerabilities.length * 10
        return Math.min(100, Math.round((rawScore / maxPossible) * 100))
    }, [vulnerabilities])

    const riskColor = riskScore <= 30 ? 'text-emerald-500' : riskScore <= 60 ? 'text-amber-500' : 'text-severity-critical'
    const riskStrokeColor = riskScore <= 30 ? 'stroke-emerald-500' : riskScore <= 60 ? 'stroke-amber-500' : 'stroke-severity-critical'
    const riskLabel = riskScore <= 30 ? 'Low Risk' : riskScore <= 60 ? 'Moderate Risk' : 'High Risk'


    // PDF Download Handler
    const handleExportPdf = React.useCallback(async () => {
        // Demo mode: generate PDF entirely client-side
        if (demoMode) {
            if (vulnerabilities.length === 0) {
                toast.error('No vulnerabilities to export')
                return
            }
            setIsGeneratingPdf(true)
            try {
                const { generateDemoReportPDF } = await import('@/lib/demo-pdf-generator')
                const pdfBytes = await generateDemoReportPDF({
                    vulnerabilities,
                    projectName: 'Demo Security Assessment',
                })
                const blob = new Blob([pdfBytes], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `vulniq-demo-report.pdf`
                a.click()
                URL.revokeObjectURL(url)
                setPdfDownloaded(true)
                toast.success('Demo PDF report downloaded!')
            } catch (error) {
                console.error('Error generating demo PDF:', error)
                toast.error(error.message || 'Failed to generate PDF report')
            } finally {
                setIsGeneratingPdf(false)
            }
            return
        }

        if (!runId || vulnerabilities.length === 0) {
            toast.error('No vulnerabilities to export')
            return
        }

        setIsGeneratingPdf(true)
        // Each download generates a new password, so clear old one
        setPdfPassword(null)
        setShowPdfPassword(false)
        try {
            const summary = {
                totalVulnerabilities: vulnerabilities.length,
                criticalCount: vulnerabilities.filter(v => v.severity === 'Critical').length,
                highCount: vulnerabilities.filter(v => v.severity === 'High').length,
                mediumCount: vulnerabilities.filter(v => v.severity === 'Medium').length,
                lowCount: vulnerabilities.filter(v => v.severity === 'Low').length,
            }

            const response = await fetch('/api/reports/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId,
                    vulnerabilities: [],
                    summary,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                let errorData = {}
                try { errorData = JSON.parse(errorText) } catch {}
                console.error('PDF generation server error:', errorData)
                throw new Error(errorData.details || errorData.error || 'Failed to generate PDF report')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `security-report-${runId}.pdf`
            a.click()
            URL.revokeObjectURL(url)

            setPdfDownloaded(true)
            toast.success('Password-protected PDF downloaded! Authenticate to reveal the password.')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error(error.message || 'Failed to generate PDF report')
        } finally {
            setIsGeneratingPdf(false)
        }
    }, [runId, vulnerabilities, demoMode])

    // Copy PDF password to clipboard
    const handleCopyPassword = React.useCallback(async () => {
        if (!pdfPassword) return
        try {
            await navigator.clipboard.writeText(pdfPassword)
            setCopiedPassword(true)
            toast.success('Password copied to clipboard')
            setTimeout(() => setCopiedPassword(false), 2000)
        } catch {
            toast.error('Failed to copy password')
        }
    }, [pdfPassword])

    /**
     * Register a new passkey OR authenticate with an existing one, then
     * use the server-issued unlock token to fetch the PDF password.
     */
    const handleRevealPassword = React.useCallback(async () => {
        // If password is already loaded, just toggle visibility
        if (pdfPassword) {
            setShowPdfPassword(prev => !prev)
            return
        }

        setIsAuthenticating(true)
        try {
            const { startRegistration, startAuthentication } = await import('@simplewebauthn/browser')

            if (!hasPasskey) {
                // ── Register a new passkey ──
                const regOptRes = await fetch('/api/user/passkey/register-options', { method: 'POST' })
                if (!regOptRes.ok) throw new Error((await regOptRes.json()).error || 'Failed to get registration options')
                const { options: regOptions } = await regOptRes.json()

                const credential = await startRegistration({ optionsJSON: regOptions })

                const regVerifyRes = await fetch('/api/user/passkey/register-verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ response: credential, deviceName: navigator.userAgent.slice(0, 60) }),
                })
                if (!regVerifyRes.ok) throw new Error((await regVerifyRes.json()).error || 'Registration failed')

                setHasPasskey(true)
                toast.success('Biometric unlock set up! Tap the button again to reveal the password.')
                return // Return — user will click again to authenticate
            }

            // ── Authenticate with the passkey ──
            const authOptRes = await fetch('/api/user/passkey/auth-options', { method: 'POST' })
            if (!authOptRes.ok) throw new Error((await authOptRes.json()).error || 'Failed to get auth options')
            const { options: authOptions } = await authOptRes.json()

            const assertion = await startAuthentication({ optionsJSON: authOptions })

            const authVerifyRes = await fetch('/api/user/passkey/auth-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: assertion }),
            })
            if (!authVerifyRes.ok) throw new Error((await authVerifyRes.json()).error || 'Authentication failed')
            const { unlockToken } = await authVerifyRes.json()

            // ── Fetch password with the unlock token ──
            const pwRes = await fetch(`/api/reports/pdf?runId=${runId}&action=password`, {
                headers: { 'Authorization': `Bearer ${unlockToken}` },
            })
            if (!pwRes.ok) {
                const data = await pwRes.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to retrieve password')
            }
            const { password } = await pwRes.json()
            if (password) {
                setPdfPassword(password)
                setShowPdfPassword(true)
            } else {
                toast.error('No password found. Download the PDF report first.')
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                toast.error('Authentication cancelled')
            } else {
                toast.error(err.message || 'Failed to authenticate')
            }
        } finally {
            setIsAuthenticating(false)
        }
    }, [pdfPassword, runId, hasPasskey])

    // Find the current executing or first pending status
    const currentStatus = statusItems.find(item => item.status === "executing") ||
        statusItems.find(item => item.status === "pending") ||
        statusItems[statusItems.length - 1] ||
        { name: detailedStatus.message || 'Workflow', status: detailedStatus.phase === 'completed' ? 'completed' : 'pending' }

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <IconCircleCheckFilled className="size-4 text-success" />
            case "executing":
                return <IconLoader className="size-4 text-primary animate-spin" />
            case "pending":
                return <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
            default:
                return null
        }
    }

    if (error && !vulnerabilities.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                    <ShieldAlert className="h-7 w-7 text-destructive" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Analysis Error</h3>
                    <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1 h-full">
            <div className="flex flex-col gap-4 p-2 sm:p-4 pt-0 pb-6">
                {/* Top Dashboard Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-1">
                    {/* Workflow Progress Card */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                    <Card className="h-full hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        {getStatusIcon(currentStatus.status)}
                                    </div>
                                    <CardTitle className="text-sm font-medium">
                                        {currentStatus.name}
                                    </CardTitle>
                                </div>
                                {currentStatus.status === "executing" && (
                                    <Badge variant="secondary" className="text-xs">
                                        Active
                                    </Badge>
                                )}
                                {progressValue === 100 && (
                                    <Badge variant="outline" className="text-xs text-success border-success/30">
                                        Complete
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                {detailedStatus.message}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Progress</span>
                                    <span className="tabular-nums font-medium text-foreground">{progressValue}%</span>
                                </div>
                                <Progress
                                    value={progressValue}
                                    className="h-2 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-500"
                                />
                            </div>

                            {/* Agent Steps */}
                            {detailedStatus.steps && detailedStatus.steps.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                            Pipeline Status
                                            {detailedStatus.phase === 'reviewing' && (
                                                <span className="inline-flex items-center gap-1 text-primary">
                                                    <IconTrendingUp className="size-3" />
                                                    <span className="animate-pulse text-[10px]">Analyzing</span>
                                                </span>
                                            )}
                                        </p>
                                        {detailedStatus.steps.map((step, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2.5 text-xs relative"
                                            >
                                                {/* Vertical connector line */}
                                                {index < detailedStatus.steps.length - 1 && (
                                                    <div className={`absolute left-[7px] top-[18px] w-px h-[calc(100%+4px)] ${
                                                        step.status === 'completed' ? 'bg-success/40' : 'bg-border'
                                                    }`} />
                                                )}
                                                <div className="flex-shrink-0 relative z-10 bg-card">
                                                    {step.status === 'completed' && (
                                                        <IconCircleCheckFilled className="size-3.5 text-success" />
                                                    )}
                                                    {step.status === 'running' && (
                                                        <IconLoader className="size-3.5 text-primary animate-spin" />
                                                    )}
                                                    {step.status === 'pending' && (
                                                        <div className="size-3.5 rounded-full border-2 border-muted-foreground/20 bg-card" />
                                                    )}
                                                    {step.status === 'failed' && (
                                                        <div className="size-3.5 rounded-full bg-destructive" />
                                                    )}
                                                </div>
                                                <div className={`flex-1 flex items-center justify-between gap-1 rounded-md px-2 py-1 transition-colors ${
                                                    step.status === 'running'
                                                        ? 'bg-primary/5 font-medium text-foreground'
                                                        : step.status === 'completed'
                                                            ? 'text-muted-foreground'
                                                            : 'text-muted-foreground/60'
                                                }`}>
                                                    <span>{step.name}</span>
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        {step.status === 'running' && (
                                                            <span className="flex gap-0.5">
                                                                <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                                            </span>
                                                        )}
                                                        {step.timestamp && step.status === 'completed' && (
                                                            <span className="text-muted-foreground text-[10px] tabular-nums">
                                                                {new Date(step.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    </motion.div>

                    {/* Findings & Assets Card */}
                    <motion.div
                        className="lg:col-span-3"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.08 }}
                    >
                    <Card className="h-full hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-medium">Vulnerabilities Found</CardTitle>
                                    <CardDescription>Security assessment results</CardDescription>
                                </div>
                                {/* Risk Score Gauge */}
                                <AnimatePresence>
                                    {vulnerabilities.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-2.5"
                                        >
                                            <div className="relative w-14 h-14">
                                                {riskScore > 60 && (
                                                    <div className="absolute inset-0 rounded-full animate-ping opacity-10" style={{ backgroundColor: `hsl(var(--severity-critical))` }} />
                                                )}
                                                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                                    <circle cx="28" cy="28" r="23" fill="none" strokeWidth="3" className="stroke-muted" />
                                                    <circle
                                                        cx="28" cy="28" r="23" fill="none" strokeWidth="3"
                                                        className={riskStrokeColor}
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${2 * Math.PI * 23}`}
                                                        strokeDashoffset={`${2 * Math.PI * 23 * (1 - riskScore / 100)}`}
                                                        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                                                    />
                                                </svg>
                                                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums ${riskColor}`}>
                                                    {riskScore}
                                                </span>
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className={`text-xs font-semibold ${riskColor}`}>{riskLabel}</p>
                                                <p className="text-[10px] text-muted-foreground">Risk Score</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Severity Stats Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                {vulnerabilityStats.map((stat, i) => {
                                    const borderColor = stat.severity === 'Critical' ? 'var(--severity-critical)'
                                        : stat.severity === 'High' ? 'var(--severity-high)'
                                        : stat.severity === 'Medium' ? 'var(--severity-medium)'
                                        : 'var(--severity-low)'
                                    return (
                                        <motion.div
                                            key={stat.severity}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
                                            className="flex flex-col items-start rounded-md border bg-card p-3 border-l-[3px]"
                                            style={{ borderLeftColor: `hsl(${borderColor})` }}
                                        >
                                            <p className="text-[11px] text-muted-foreground">{stat.severity}</p>
                                            <p className={`text-xl font-bold tabular-nums ${stat.color}`}>
                                                {stat.count}
                                            </p>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Total */}
                            {vulnerabilities.length > 0 && (
                                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2.5">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                        Total Issues
                                    </span>
                                    <span className="text-lg font-bold tabular-nums">
                                        {vulnerabilities.length}
                                    </span>
                                </div>
                            )}

                            {/* Assets Section */}
                            {vulnerabilities.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Assets
                                        </p>

                                        {/* PDF Report row */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handleExportPdf}
                                                disabled={isGeneratingPdf}
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                            >
                                                {isGeneratingPdf ? (
                                                    <>
                                                        <IconLoader className="h-3.5 w-3.5 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-3.5 w-3.5" />
                                                        PDF Report
                                                    </>
                                                )}
                                            </Button>
                                            {pdfDownloaded && !demoMode && (
                                                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5">
                                                    <Lock className="h-2.5 w-2.5" />
                                                    Encrypted
                                                </Badge>
                                            )}
                                            {pdfDownloaded && demoMode && (
                                                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5">
                                                    <Download className="h-2.5 w-2.5" />
                                                    Demo
                                                </Badge>
                                            )}
                                        </div>

                                        {/* PDF Password section - only for authenticated (non-demo) reports */}
                                        {pdfDownloaded && !demoMode && (
                                            <div className="rounded-md border bg-muted/30 p-2.5 space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[11px] font-medium text-muted-foreground">
                                                        PDF Password
                                                    </span>
                                                </div>

                                                {!pdfPassword ? (
                                                    /* Authenticate to reveal */
                                                    <div className="space-y-1.5">
                                                        <Button
                                                            onClick={handleRevealPassword}
                                                            disabled={isAuthenticating}
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full gap-2 text-xs"
                                                        >
                                                            {isAuthenticating ? (
                                                                <>
                                                                    <IconLoader className="h-3.5 w-3.5 animate-spin" />
                                                                    {hasPasskey ? 'Authenticating...' : 'Setting up...'}
                                                                </>
                                                            ) : hasPasskey ? (
                                                                <>
                                                                    <Fingerprint className="h-3.5 w-3.5" />
                                                                    Unlock with biometrics
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <KeyRound className="h-3.5 w-3.5" />
                                                                    Set up biometric unlock
                                                                </>
                                                            )}
                                                        </Button>
                                                        <p className="text-[10px] text-muted-foreground leading-tight text-center">
                                                            {hasPasskey
                                                                ? 'Verify your identity to reveal the password'
                                                                : 'Register your device to securely unlock passwords'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    /* Password revealed */
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1">
                                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                                Identity verified
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex-1 flex items-center gap-1.5 rounded border bg-background px-2 py-1 font-mono text-xs select-all">
                                                                {showPdfPassword ? (
                                                                    <span className="tracking-wider">{pdfPassword}</span>
                                                                ) : (
                                                                    <span className="tracking-wider text-muted-foreground">{'•'.repeat(12)}</span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 shrink-0"
                                                                onClick={() => setShowPdfPassword(prev => !prev)}
                                                                title={showPdfPassword ? 'Hide password' : 'Show password'}
                                                                aria-label={showPdfPassword ? 'Hide password' : 'Show password'}
                                                            >
                                                                {showPdfPassword ? (
                                                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                                ) : (
                                                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 shrink-0"
                                                                onClick={handleCopyPassword}
                                                                title="Copy password"
                                                                aria-label="Copy password"
                                                            >
                                                                {copiedPassword ? (
                                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                                            Use this password to open the PDF report
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    </motion.div>
                </div>

                {/* Vulnerability Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    <DataTable data={vulnerabilities} runId={runId} />
                </motion.div>
            </div>
        </ScrollArea>
    )
}

