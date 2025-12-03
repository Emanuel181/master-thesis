"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { File, X, Upload, Shield, Server, Code } from "lucide-react"
import { toast } from "sonner"

export default function KnowledgeBaseVisualization() {
  const [selectedUseCase, setSelectedUseCase] = useState("login")
  const [documents, setDocuments] = useState({
    login: [
      { name: "auth-implementation.pdf", size: "2.3 MB", type: "pdf" },
      { name: "oauth-guide.pdf", size: "1.8 MB", type: "pdf" },
    ],
    serverApi: [
      { name: "rest-api-design.pdf", size: "3.2 MB", type: "pdf" },
      { name: "middleware-patterns.pdf", size: "2.1 MB", type: "pdf" },
      { name: "database-schema.pdf", size: "1.5 MB", type: "pdf" },
    ],
    clientCode: [
      { name: "react-best-practices.pdf", size: "2.7 MB", type: "pdf" },
      { name: "state-management.pdf", size: "1.9 MB", type: "pdf" },
    ],
  })

  const [uploadState, setUploadState] = useState({
    file: null,
    progress: 0,
    uploading: false,
  })
  const fileInputRef = useRef(null)

  const useCases = [
    {
      id: "login",
      name: "Login & Authentication",
      icon: ShieldIcon,
      description: "Documents for authentication, OAuth, JWT, and security",
      count: documents.login.length
    },
    {
      id: "serverApi",
      name: "Server Side API",
      icon: ServerIcon,
      description: "Backend APIs, middleware, and server-side logic",
      count: documents.serverApi.length
    },
    {
      id: "clientCode",
      name: "Client Side Code",
      icon: CodeIcon,
      description: "Frontend components, state management, and UI logic",
      count: documents.clientCode.length
    },
  ]

  const validFileTypes = ["application/pdf"]
  const validExtensions = ['.pdf']

  const handleFile = (file) => {
    if (!file) return

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidType = validFileTypes.includes(file.type) || validExtensions.includes(fileExt)

    if (isValidType) {
      setUploadState({ file, progress: 0, uploading: true })

      const interval = setInterval(() => {
        setUploadState((prev) => {
          const newProgress = prev.progress + 10
          if (newProgress >= 100) {
            clearInterval(interval)

            // Add document to the selected use case
            const newDoc = {
              name: file.name,
              size: formatFileSize(file.size),
              type: "pdf"
            }

            setDocuments(prev => ({
              ...prev,
              [selectedUseCase]: [...prev[selectedUseCase], newDoc]
            }))

            toast.success("Document uploaded successfully!", {
              position: "bottom-right",
              duration: 3000,
            })

            setUploadState({ file: null, progress: 0, uploading: false })
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }

            return { ...prev, progress: 100, uploading: false }
          }
          return { ...prev, progress: newProgress }
        })
      }, 150)
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

  const deleteDocument = (useCase, docName) => {
    setDocuments(prev => ({
      ...prev,
      [useCase]: prev[useCase].filter(doc => doc.name !== docName)
    }))
    toast.success("Document deleted successfully!", {
      position: "bottom-right",
      duration: 2000,
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const currentDocuments = documents[selectedUseCase]

  const renderUseCaseContent = (useCaseId) => {
    const docs = documents[useCaseId]

    return (
      <div className="space-y-6">
        {/* Upload Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
          <div
            className="flex justify-center rounded-md border border-dashed border-input px-6 py-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden={true} />
              <div className="flex text-sm leading-6 text-muted-foreground mt-2 justify-center">
                <p>Drag and drop or</p>
                <label
                  htmlFor={`file-upload-${useCaseId}`}
                  className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
                >
                  <span>choose file</span>
                  <input
                    id={`file-upload-${useCaseId}`}
                    name={`file-upload-${useCaseId}`}
                    type="file"
                    className="sr-only"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </label>
                <p className="pl-1">to upload</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">PDF files only • Max. size: 10MB</p>
            </div>
          </div>

          {uploadState.file && uploadState.uploading && (
            <Card className="relative mt-4 bg-muted p-4">
              <div className="flex items-center space-x-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-background shadow-sm ring-1 ring-inset ring-border">
                  <File className="h-5 w-5 text-red-500" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{uploadState.file?.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {uploadState.file && formatFileSize(uploadState.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-3">
                <Progress value={uploadState.progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{uploadState.progress}%</span>
              </div>
            </Card>
          )}
        </Card>

        {/* Documents Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Documents ({docs.length})
          </h3>
          {docs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {docs.map((doc, index) => (
                <div key={index} className="relative group">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteDocument(useCaseId, doc.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <File className="h-12 w-12 text-red-500" />
                    <div className="text-sm font-medium truncate w-full text-center" title={doc.name}>
                      {doc.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{doc.size}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex-1 rounded-xl bg-muted/50 p-8">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Knowledge Base</h2>
        <p className="text-muted-foreground mb-6">Organize your documentation by use case</p>

        <Tabs defaultValue="login" className="w-full" onValueChange={setSelectedUseCase}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Login & Auth</span>
              <span className="sm:hidden">Login</span>
              <span className="text-xs text-muted-foreground ml-1">({documents.login.length})</span>
            </TabsTrigger>
            <TabsTrigger value="serverApi" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Server API</span>
              <span className="sm:hidden">API</span>
              <span className="text-xs text-muted-foreground ml-1">({documents.serverApi.length})</span>
            </TabsTrigger>
            <TabsTrigger value="clientCode" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Client Code</span>
              <span className="sm:hidden">Client</span>
              <span className="text-xs text-muted-foreground ml-1">({documents.clientCode.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            {renderUseCaseContent("login")}
          </TabsContent>

          <TabsContent value="serverApi">
            {renderUseCaseContent("serverApi")}
          </TabsContent>

          <TabsContent value="clientCode">
            {renderUseCaseContent("clientCode")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



