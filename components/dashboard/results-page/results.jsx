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
    IconPlus,
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
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FixReview } from "@/components/dashboard/fix-review/fix-review"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
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

export const schema = z.object({
    id: z.number(),
    severity: z.string(),
    title: z.string(),
    type: z.string(),
    details: z.string(),
    fileName: z.string(),
    tasks: z.array(z.object({
        id: z.string(),
        name: z.string(),
        assignee: z.string(),
        status: z.string(),
    })).optional(),
})

// No sample data - will use data from props

const severityColors = {
    "Critical": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
    "High": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    "Low": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700"
}

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
        cell: ({ row }) => {
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
            }, [isResizing])

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
                                        <div className={`w-0.5 h-8 rounded-full transition-colors ${
                                            isResizing ? 'bg-primary' : 'bg-muted-foreground/50 group-hover:bg-primary/70'
                                        }`}></div>
                                        <div className={`w-0.5 h-8 rounded-full transition-colors ${
                                            isResizing ? 'bg-primary' : 'bg-muted-foreground/50 group-hover:bg-primary/70'
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
                                                <p className="text-sm text-muted-foreground mt-1">CWE-89: Improper Neutralization of Special Elements</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Severity:</span>
                                                    <Badge variant="outline" className={`px-2 py-1 ${
                                                        row.original.severity === "Critical" ? severityColors["Critical"] :
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
                                                <TabsTrigger
                                                    value="description"
                                                    className="bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-white data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=inactive]:hover:bg-accent/50 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none transition-colors"
                                                >
                                                    Description
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="exploit"
                                                    className="bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-white data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=inactive]:hover:bg-accent/50 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none transition-colors"
                                                >
                                                    Exploit
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="debate"
                                                    className="bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-white data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=inactive]:hover:bg-accent/50 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none transition-colors"
                                                >
                                                    Multi-agent debate mode
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="attack-path"
                                                    className="bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-white data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=inactive]:hover:bg-accent/50 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none transition-colors"
                                                >
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
                                                    
                                                    <div className="space-y-2">
                                                        <h3 className="text-sm font-semibold">Framework-Specific Best Practices</h3>
                                                        <div className="text-sm text-muted-foreground">
                                                            <p>{row.original.bestPractices || 'Use parameterized queries or prepared statements to prevent SQL injection. Implement input validation and sanitization. Follow the principle of least privilege for database access.'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="exploit" className="p-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="text-sm font-semibold mb-2">Exploit Examples</h3>
                                                        <p className="text-sm text-muted-foreground mb-4">
                                                            {row.original.exploitExamples || 'Demonstration of how this vulnerability can be exploited'}
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
                                                <div className="space-y-4">
                                                    <div className="text-center py-8">
                                                        <p className="text-sm text-muted-foreground">
                                                            Multi-agent debate mode coming soon
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            This feature will allow multiple AI agents to discuss and refine vulnerability findings
                                                        </p>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="attack-path" className="p-6">
                                                <div className="space-y-4">
                                                    <div className="text-center py-8">
                                                        <p className="text-sm text-muted-foreground">
                                                            Attack path visualization coming soon
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            This feature will provide visual representation of attack scenarios
                                                        </p>
                                                    </div>
                                                </div>
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
        },
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
    const [mounted, setMounted] = React.useState(false)

    // Update data when initialData changes
    React.useEffect(() => {
        console.log('DataTable received data:', initialData)
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
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: (row) => !!row.original.tasks,
    })

    function handleDragEnd(event) {
        const { active, over } = event

        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = dataIds.indexOf(active.id)
                const newIndex = dataIds.indexOf(over.id)
                return arrayMove(data, oldIndex, newIndex)
            })
        }
    }

    const toggleSeverity = (severity) => {
        setSeverityFilter(prev => 
            prev.includes(severity) 
                ? prev.filter(s => s !== severity)
                : [...prev, severity]
        )
    }

    return (
        <Tabs
            defaultValue="outline"
            className="w-full flex-col justify-start gap-6"
            onValueChange={(value) => {
                // Handle tab changes to filter by severity
                if (value === "past-performance") {
                    setSeverityFilter(["Critical"])
                } else if (value === "key-personnel") {
                    setSeverityFilter(["High"])
                } else if (value === "focus-documents") {
                    setSeverityFilter(["Medium"])
                } else if (value === "low-severity") {
                    setSeverityFilter(["Low"])
                } else {
                    setSeverityFilter([])
                }
            }}
        >
            <div className="flex items-center justify-between">
                <Label htmlFor="view-selector" className="sr-only">
                    View
                </Label>
                <Select defaultValue="outline">
                    <SelectTrigger
                        className="flex w-fit @4xl/main:hidden"
                        size="sm"
                        id="view-selector"
                    >
                        <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="outline">Critical</SelectItem>
                        <SelectItem value="past-performance">High</SelectItem>
                        <SelectItem value="key-personnel">Medium</SelectItem>
                        <SelectItem value="focus-documents">Low</SelectItem>
                    </SelectContent>
                </Select>

                <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
                    <TabsTrigger value="outline">Outline</TabsTrigger>
                    <TabsTrigger value="past-performance">
                        Critical <Badge variant="secondary" className={severityColors["Critical"]}>{mounted ? data.filter(d => d.severity === "Critical").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="key-personnel">
                        High <Badge variant="secondary" className={severityColors["High"]}>{mounted ? data.filter(d => d.severity === "High").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="focus-documents">
                        Medium <Badge variant="secondary" className={severityColors["Medium"]}>{mounted ? data.filter(d => d.severity === "Medium").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="low-severity">
                        Low <Badge variant="secondary" className={severityColors["Low"]}>{mounted ? data.filter(d => d.severity === "Low").length : 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="fixes">
                        Fixes
                    </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
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
                    <Button variant="outline" size="sm">
                        <IconPlus />
                        <span className="hidden lg:inline">Add Section</span>
                    </Button>
                </div>
            </div>

            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto"
            >
                <div className="w-full overflow-hidden rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                    >
                        <div className="w-full overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
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
                                                                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                                                                    header.column.getIsResizing()
                                                                        ? 'bg-primary opacity-100'
                                                                        : 'bg-border opacity-0 hover:opacity-100'
                                                                } transition-opacity`}
                                                            />
                                                        )}
                                                    </TableHead>
                                                )
                                            })}
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
                                                className="h-24 text-center"
                                            >
                                                No results.
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
                            <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
            </TabsContent>

            <TabsContent
                value="past-performance"
                className="relative flex flex-col gap-4 overflow-auto"
            >
                <div className="w-full overflow-hidden rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId + "-critical"}
                    >
                        <div className="w-full overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
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
                                                                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                                                                    header.column.getIsResizing()
                                                                        ? 'bg-primary opacity-100'
                                                                        : 'bg-border opacity-0 hover:opacity-100'
                                                                } transition-opacity`}
                                                            />
                                                        )}
                                                    </TableHead>
                                                )
                                            })}
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
                                                className="h-24 text-center"
                                            >
                                                No results.
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
                            <Label htmlFor="rows-per-page-critical" className="text-sm font-medium">
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page-critical">
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
            </TabsContent>

            <TabsContent value="key-personnel" className="relative flex flex-col gap-4 overflow-auto">
                {/* Same table structure for High severity */}
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                    High Severity Vulnerabilities
                </div>
            </TabsContent>

            <TabsContent
                value="focus-documents"
                className="relative flex flex-col gap-4 overflow-auto"
            >
                {/* Same table structure for Medium severity */}
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                    Medium Severity Vulnerabilities
                </div>
            </TabsContent>

            <TabsContent
                value="low-severity"
                className="relative flex flex-col gap-4 overflow-auto"
            >
                {/* Same table structure for Low severity */}
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                    Low Severity Vulnerabilities
                </div>
            </TabsContent>

            <TabsContent
                value="fixes"
                className="relative flex flex-col h-full overflow-hidden"
            >
                <FixReview runId={runId} />
            </TabsContent>
        </Tabs>
    )
}

export function Results({ initialCode, problems = [], generatedCode = "", vulnerabilities: initialVulnerabilities = [], runId: propRunId, userId }) {
    const [vulnerabilities, setVulnerabilities] = React.useState(initialVulnerabilities)
    const [progressValue, setProgressValue] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState(null)
    const [runId, setRunId] = React.useState(propRunId)
    const [isPolling, setIsPolling] = React.useState(true)
    const [detailedStatus, setDetailedStatus] = React.useState({
        phase: 'initializing',
        message: 'Starting workflow...',
        steps: []
    })
    const [statusItems, setStatusItems] = React.useState([
        { id: 1, name: "Preparatory", status: "pending" },
        { id: 2, name: "Reviewer Agent", status: "pending" },
        { id: 3, name: "Implementer Agent", status: "pending" },
        { id: 4, name: "Tester Agent", status: "pending" },
        { id: 5, name: "Reporter Agent", status: "pending" },
    ])

    // Get runId from localStorage if not provided as prop
    React.useEffect(() => {
        if (!propRunId && typeof window !== 'undefined') {
            const storedRunId = localStorage.getItem('vulniq_current_run_id')
            if (storedRunId) {
                setRunId(storedRunId)
            }
        }
    }, [propRunId])

    // Set loading state when runId is available
    React.useEffect(() => {
        if (runId) {
            setIsLoading(true)
        }
    }, [runId])

    // Fetch workflow data if runId is provided
    React.useEffect(() => {
        if (!runId) return

        const fetchWorkflowData = async () => {
            try {
                console.log('Fetching workflow data for runId:', runId)
                const response = await fetch(`/api/workflow/start?runId=${runId}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch workflow data')
                }
                
                const result = await response.json()
                console.log('Workflow data received:', result)
                
                if (result.success && result.data) {
                    console.log('Vulnerabilities:', result.data.vulnerabilities)
                    setVulnerabilities(result.data.vulnerabilities || [])
                    
                    // Update detailed status
                    if (result.data.detailedStatus) {
                        setDetailedStatus(result.data.detailedStatus)
                    }
                    
                    // Update progress based on status
                    const status = result.data.status
                    const currentAgent = result.data.currentAgent
                    const agentProgress = result.data.agentProgress || 0
                    
                    console.log('Workflow status:', status)
                    console.log('Current agent:', currentAgent)
                    console.log('Agent progress:', agentProgress)
                    console.log('Detailed status:', result.data.detailedStatus)
                    
                    if (status === 'completed') {
                        setProgressValue(100)
                        setStatusItems(prev => prev.map(item => ({ ...item, status: "completed" })))
                        setIsPolling(false) // Stop polling when completed
                    } else if (status === 'running') {
                        setProgressValue(agentProgress)
                        
                        // Update status items based on current agent
                        setStatusItems(prev => prev.map((item) => {
                            if (item.name === currentAgent) {
                                return { ...item, status: "executing" }
                            } else if (item.name === 'Preparatory' || 
                                      (currentAgent === 'Reporter Agent' && item.name === 'Reviewer Agent')) {
                                return { ...item, status: "completed" }
                            } else {
                                return { ...item, status: "pending" }
                            }
                        }))
                    } else if (status === 'failed') {
                        setError('Workflow execution failed')
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
    }, [runId, isPolling])

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
            { severity: "Critical", count: stats.Critical, color: "text-red-600 dark:text-red-400" },
            { severity: "High", count: stats.High, color: "text-purple-600 dark:text-purple-400" },
            { severity: "Medium", count: stats.Medium, color: "text-yellow-600 dark:text-yellow-400" },
            { severity: "Low", count: stats.Low, color: "text-green-600 dark:text-green-400" },
        ]
    }, [vulnerabilities])

    // Update progress based on vulnerabilities found
    React.useEffect(() => {
        if (vulnerabilities.length > 0) {
            setProgressValue(100)
            setStatusItems(prev => prev.map(item => ({ ...item, status: "completed" })))
        }
    }, [vulnerabilities])

    // Find the current executing or first pending status
    const currentStatus = statusItems.find(item => item.status === "executing") || 
                         statusItems.find(item => item.status === "pending") ||
                         statusItems[statusItems.length - 1]

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <IconCircleCheckFilled className="size-4 text-green-500" />
            case "executing":
                return <IconLoader className="size-4 text-blue-500 animate-spin" />
            case "pending":
                return <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
            default:
                return null
        }
    }

    return (
        <ScrollArea className="flex-1 h-full">
            <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 pt-0 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4">
                    <Card className="min-h-[200px] transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Agent Status Header with Animation */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        {getStatusIcon(currentStatus.status)}
                                        {currentStatus.status === "executing" && (
                                            <span className="absolute inset-0 animate-ping opacity-75">
                                                <IconLoader className="size-4 text-blue-500" />
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                                        {currentStatus.name}
                                    </span>
                                    {currentStatus.status === "executing" && (
                                        <span className="ml-auto text-xs text-blue-500 animate-pulse">
                                            Active
                                        </span>
                                    )}
                                </div>
                                
                                {/* Progress Section with Smooth Animation */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 animate-in fade-in slide-in-from-left-3 duration-500">
                                        <p className="text-sm font-medium">Analysis Progress</p>
                                        <p className="text-xs text-muted-foreground transition-all duration-300">
                                            {detailedStatus.message}
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium tabular-nums transition-all duration-300">
                                        {progressValue}%
                                    </span>
                                </div>
                                
                                {/* Animated Progress Bar */}
                                <div className="relative">
                                    <Progress 
                                        value={progressValue} 
                                        className="[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-blue-500 [&_[data-slot=progress-indicator]]:to-green-500 [&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out" 
                                    />
                                    {progressValue < 100 && progressValue > 0 && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                                             style={{
                                                 backgroundSize: '200% 100%',
                                                 animation: 'shimmer 2s infinite'
                                             }}
                                        />
                                    )}
                                </div>
                                
                                {/* Detailed Steps with Staggered Animation */}
                                {detailedStatus.steps && detailedStatus.steps.length > 0 && (
                                    <div className="mt-4 space-y-2 border-t pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                            <span>Current Activity:</span>
                                            {detailedStatus.phase === 'reviewing' && (
                                                <span className="inline-flex items-center gap-1 text-blue-500">
                                                    <IconTrendingUp className="size-3 animate-bounce" />
                                                    <span className="animate-pulse">Analyzing</span>
                                                </span>
                                            )}
                                        </p>
                                        {detailedStatus.steps.map((step, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center gap-2 text-xs transition-all duration-300 animate-in fade-in slide-in-from-left-1"
                                                style={{
                                                    animationDelay: `${index * 100}ms`,
                                                    animationFillMode: 'backwards'
                                                }}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    {step.status === 'completed' && (
                                                        <IconCircleCheckFilled className="size-3 text-green-500 animate-in zoom-in duration-300" />
                                                    )}
                                                    {step.status === 'running' && (
                                                        <>
                                                            <IconLoader className="size-3 text-blue-500 animate-spin" />
                                                            <span className="absolute inset-0 animate-ping opacity-50">
                                                                <div className="size-3 rounded-full bg-blue-500" />
                                                            </span>
                                                        </>
                                                    )}
                                                    {step.status === 'pending' && (
                                                        <div className="size-3 rounded-full border-2 border-muted-foreground/30 animate-pulse" />
                                                    )}
                                                    {step.status === 'failed' && (
                                                        <div className="size-3 rounded-full bg-red-500 animate-in zoom-in duration-300" />
                                                    )}
                                                </div>
                                                <span className={`transition-all duration-300 ${
                                                    step.status === 'running' 
                                                        ? 'font-medium text-foreground' 
                                                        : step.status === 'completed'
                                                        ? 'text-muted-foreground line-through decoration-green-500/50'
                                                        : 'text-muted-foreground'
                                                }`}>
                                                    {step.name}
                                                </span>
                                                {step.status === 'running' && (
                                                    <span className="ml-auto flex gap-1">
                                                        <span className="size-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="size-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="size-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </span>
                                                )}
                                                {step.timestamp && step.status === 'completed' && (
                                                    <span className="text-muted-foreground ml-auto text-[10px] animate-in fade-in duration-300">
                                                        {new Date(step.timestamp).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="min-h-[200px] transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                    <p className="text-sm font-medium">Vulnerabilities Found</p>
                                    <p className="text-xs text-muted-foreground">
                                        Security assessment results
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between gap-4">
                                    {vulnerabilityStats.map((stat, index) => (
                                        <div 
                                            key={stat.severity} 
                                            className="flex flex-col items-center space-y-1 animate-in fade-in zoom-in duration-500"
                                            style={{
                                                animationDelay: `${index * 100}ms`,
                                                animationFillMode: 'backwards'
                                            }}
                                        >
                                            <p className="text-xs text-muted-foreground">{stat.severity}</p>
                                            <div className="relative">
                                                <p className={`text-2xl font-bold tabular-nums transition-all duration-500 ${stat.color}`}>
                                                    {stat.count}
                                                </p>
                                                {stat.count > 0 && (
                                                    <div className="absolute inset-0 animate-ping opacity-20">
                                                        <p className={`text-2xl font-bold ${stat.color}`}>
                                                            {stat.count}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Total Count with Animation */}
                                {vulnerabilities.length > 0 && (
                                    <div className="pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Total Issues</span>
                                            <span className="text-lg font-bold tabular-nums">
                                                {vulnerabilities.length}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="w-full">
                    <DataTable data={vulnerabilities} runId={runId} />
                </div>
            </div>
        </ScrollArea>
    )
}

