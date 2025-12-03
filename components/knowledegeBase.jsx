"use client"

import React, { useRef, useState } from "react"
import { File, FileCode, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function KnowledegeBase() {
    const [uploadState, setUploadState] = useState({
        file: null,
        progress: 0,
        uploading: false,
    })
    const fileInputRef = useRef(null)

    const validFileTypes = [
        "application/pdf",
    ]

    const validExtensions = ['.pdf']

    const handleFile = (file) => {
        if (!file) return

        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
        const isValidType = validFileTypes.includes(file.type) || validExtensions.includes(fileExt)

        if (isValidType) {
            setUploadState({ file, progress: 0, uploading: true })

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadState((prev) => {
                    const newProgress = prev.progress + 5
                    if (newProgress >= 100) {
                        clearInterval(interval)
                        toast.success("File uploaded successfully!", {
                            position: "bottom-right",
                            duration: 3000,
                        })
                        return { ...prev, progress: 100, uploading: false }
                    }
                    return { ...prev, progress: newProgress }
                })
            }, 100)
        } else {
            toast.error("Please upload a PDF file.", {
                position: "bottom-right",
                duration: 3000,
            })
        }
    }

    const handleFileChange = (event) => {
        handleFile(event.target.files?.[0])
    }

    const handleDrop = (event) => {
        event.preventDefault()
        handleFile(event.dataTransfer.files?.[0])
    }

    const resetFile = () => {
        setUploadState({ file: null, progress: 0, uploading: false })
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const getFileIcon = () => {
        return <File className="h-5 w-5 text-red-500" />
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    }

    const { file, progress, uploading } = uploadState

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex-1 rounded-xl bg-muted/50 p-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Knowledge Base</h2>

                <div
                    className="flex justify-center rounded-md border border-dashed border-input px-6 py-12"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div>
                        <File className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden={true} />
                        <div className="flex text-sm leading-6 text-muted-foreground">
                            <p>Drag and drop or</p>
                            <label
                                htmlFor="file-upload-kb"
                                className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
                            >
                                <span>choose file</span>
                                <input
                                    id="file-upload-kb"
                                    name="file-upload-kb"
                                    type="file"
                                    className="sr-only"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                />
                            </label>
                            <p className="pl-1">to upload</p>
                        </div>
                    </div>
                </div>

                <p className="mt-2 text-xs leading-5 text-muted-foreground sm:flex sm:items-center sm:justify-between">
                    <span>Accepted file types: PDF files only.</span>
                    <span className="pl-1 sm:pl-0">Max. size: 10MB</span>
                </p>

                {file && (
                    <Card className="relative mt-8 bg-muted p-4 gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label="Remove"
                            onClick={resetFile}
                        >
                            <X className="h-5 w-5 shrink-0" aria-hidden={true} />
                        </Button>

                        <div className="flex items-center space-x-2.5">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-background shadow-sm ring-1 ring-inset ring-border">
                                {getFileIcon()}
                            </span>
                            <div>
                                <p className="text-xs font-medium text-foreground">{file?.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {file && formatFileSize(file.size)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Progress value={progress} className="h-1.5" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                    </Card>
                )}

                {file && !uploading && (
                    <div className="mt-4 flex items-center justify-end space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="whitespace-nowrap"
                            onClick={resetFile}
                        >
                            Remove
                        </Button>
                        <Button type="button" className="whitespace-nowrap">
                            Add to Knowledge Base
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

