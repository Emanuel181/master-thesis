"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Styles ---
import "./fullscreen-editor.scss";

// --- UI Components ---
import { X, Save, Loader2, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

// Autosave interval in milliseconds (30 seconds)
const AUTOSAVE_INTERVAL = 30000;

// Generate HTML from TipTap JSON
function generateHTML(json) {
  if (!json || !json.content) return "";

  const processNode = (node) => {
    if (!node) return "";
    const nodeType = node.type;

    if (nodeType === "doc") {
      return node.content?.map(processNode).join("") || "";
    }
    if (nodeType === "paragraph") {
      const pAttrs = node.attrs?.textAlign ? ` style="text-align: ${node.attrs.textAlign}"` : "";
      return `<p${pAttrs}>${node.content?.map(processNode).join("") || ""}</p>`;
    }
    if (nodeType === "heading") {
      const level = node.attrs?.level || 1;
      const hAttrs = node.attrs?.textAlign ? ` style="text-align: ${node.attrs.textAlign}"` : "";
      return `<h${level}${hAttrs}>${node.content?.map(processNode).join("") || ""}</h${level}>`;
    }
    if (nodeType === "text") {
      let text = node.text || "";
      if (node.marks) {
        node.marks.forEach((mark) => {
          const markType = mark.type;
          if (markType === "bold") text = `<strong>${text}</strong>`;
          else if (markType === "italic") text = `<em>${text}</em>`;
          else if (markType === "strike") text = `<s>${text}</s>`;
          else if (markType === "code") text = `<code>${text}</code>`;
          else if (markType === "underline") text = `<u>${text}</u>`;
          else if (markType === "link") text = `<a href="${mark.attrs?.href || "#"}">${text}</a>`;
          else if (markType === "highlight") {
            const color = mark.attrs?.color || "yellow";
            text = `<mark style="background-color: ${color}">${text}</mark>`;
          }
          else if (markType === "subscript") text = `<sub>${text}</sub>`;
          else if (markType === "superscript") text = `<sup>${text}</sup>`;
        });
      }
      return text;
    }
    if (nodeType === "bulletList") {
      return `<ul>${node.content?.map(processNode).join("") || ""}</ul>`;
    }
    if (nodeType === "orderedList") {
      return `<ol>${node.content?.map(processNode).join("") || ""}</ol>`;
    }
    if (nodeType === "listItem") {
      return `<li>${node.content?.map(processNode).join("") || ""}</li>`;
    }
    if (nodeType === "taskList") {
      return `<ul class="task-list">${node.content?.map(processNode).join("") || ""}</ul>`;
    }
    if (nodeType === "taskItem") {
      const checked = node.attrs?.checked ? "checked" : "";
      return `<li class="task-item ${checked}">${node.content?.map(processNode).join("") || ""}</li>`;
    }
    if (nodeType === "codeBlock") {
      const lang = node.attrs?.language || "";
      return `<pre><code class="language-${lang}">${node.content?.map(processNode).join("") || ""}</code></pre>`;
    }
    if (nodeType === "blockquote") {
      return `<blockquote>${node.content?.map(processNode).join("") || ""}</blockquote>`;
    }
    if (nodeType === "horizontalRule") {
      return "<hr />";
    }
    if (nodeType === "image") {
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      const title = node.attrs?.title || "";
      return `<img src="${src}" alt="${alt}" title="${title}" />`;
    }
    if (nodeType === "hardBreak") {
      return "<br />";
    }
    return node.content?.map(processNode).join("") || "";
  };

  return processNode(json);
}

// Generate plain text from TipTap JSON for word count
function generateText(json) {
  if (!json || !json.content) return "";

  const processNode = (node) => {
    if (!node) return "";
    const nodeType = node.type;

    if (nodeType === "text") return node.text || "";
    if (nodeType === "hardBreak") return "\n";
    if (nodeType === "paragraph" || nodeType === "heading") {
      return (node.content?.map(processNode).join("") || "") + "\n";
    }
    return node.content?.map(processNode).join("") || "";
  };

  return processNode(json);
}

const MainToolbarContent = ({ onHighlighterClick, onLinkClick, isMobile }) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} portal={isMobile} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>
      <Spacer />
    </>
  );
};

const MobileToolbarContent = ({ type, onBack }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? <ColorHighlightPopoverContent /> : <LinkContent />}
  </>
);

export function FullscreenEditor({ open, onOpenChange, article, onArticleUpdate }) {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState("main");
  const toolbarRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialContent, setInitialContent] = useState(null);
  const autosaveTimerRef = useRef(null);
  const hasUnsavedChanges = useRef(false);
  const [shouldCreateEditor, setShouldCreateEditor] = useState(false);

  // Only create editor when dialog is opened
  useEffect(() => {
    if (open) {
      setShouldCreateEditor(true);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Delay cleanup to allow save to complete
      const timeout = setTimeout(() => {
        setShouldCreateEditor(false);
        setInitialContent(null);
        setIsLoading(true);
        setSaveStatus("idle");
        setLastSaved(null);
        hasUnsavedChanges.current = false;
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Fetch content when dialog opens
  useEffect(() => {
    if (open && article?.id) {
      setIsLoading(true);
      fetch(`/api/articles/${article.id}/content`)
        .then((res) => res.json())
        .then((data) => {
          // Use contentJson if available, otherwise try to use content
          if (data.contentJson) {
            setInitialContent(data.contentJson);
          } else if (data.content) {
            // If only HTML content exists, we'll start fresh
            // TipTap will handle this
            setInitialContent(null);
          } else {
            setInitialContent(null);
          }
        })
        .catch((error) => {
          console.error("Error fetching content:", error);
          toast.error("Failed to load article content");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, article?.id]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Article content editor",
        class: "fullscreen-editor-prose",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent || {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Start writing your article..." }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
    onUpdate: () => {
      hasUnsavedChanges.current = true;
    },
  }, [initialContent, shouldCreateEditor]);

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent && !isLoading) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent, isLoading]);

  // Only use cursor visibility when editor is ready and mounted
  const isEditorReady = editor && editor.view && !editor.isDestroyed;
  const rect = useCursorVisibility({
    editor: isEditorReady ? editor : null,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  // Lock body scroll when editor is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Save function
  const saveContent = useCallback(async () => {
    if (!editor || !article?.id || !hasUnsavedChanges.current) return;

    try {
      setSaveStatus("saving");

      const json = editor.getJSON();
      const html = generateHTML(json);
      const text = generateText(json);

      const response = await fetch(`/api/articles/${article.id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: json,
          contentMarkdown: text,
          content: html,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const data = await response.json();

      hasUnsavedChanges.current = false;
      setSaveStatus("saved");
      setLastSaved(new Date());

      // Update article in parent
      if (data.readTime) {
        onArticleUpdate({ id: article.id, readTime: data.readTime });
      }

      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving content:", error);
      setSaveStatus("error");
      toast.error("Failed to save content");
    }
  }, [editor, article?.id, onArticleUpdate]);

  // Manual save
  const handleManualSave = () => {
    hasUnsavedChanges.current = true;
    saveContent();
  };

  // Save on close
  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges.current) {
      await saveContent();
    }
    onOpenChange(false);
  }, [saveContent, onOpenChange]);

  // Handle escape key to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!open || !editor) return;

    autosaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges.current) {
        saveContent();
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [open, editor, saveContent]);


  // Save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            <span>Saved</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <X className="h-4 w-4" />
            <span>Error saving</span>
          </div>
        );
      default:
        if (lastSaved) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              <span>Last saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          );
        }
        return null;
    }
  };

  // Don't render if not open or not in browser
  if (!open) return null;
  if (typeof document === "undefined") return null;

  const content = (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Backdrop for escape key handling */}
      <div
        className="fixed inset-0 bg-black/50 -z-10"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
              {article?.title || "Edit Article"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Editing article content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {renderSaveStatus()}
          <button
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </header>

      {/* Editor */}
      {isLoading || !editor ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col bg-background">
          <EditorContext.Provider value={{ editor }}>
            <Toolbar
              ref={toolbarRef}
              className="shrink-0"
              style={{
                ...(isMobile
                  ? {
                      bottom: `calc(100% - ${height - rect.y}px)`,
                    }
                  : {}),
              }}
            >
              {mobileView === "main" ? (
                <MainToolbarContent
                  onHighlighterClick={() => setMobileView("highlighter")}
                  onLinkClick={() => setMobileView("link")}
                  isMobile={isMobile}
                />
              ) : (
                <MobileToolbarContent
                  type={mobileView === "highlighter" ? "highlighter" : "link"}
                  onBack={() => setMobileView("main")}
                />
              )}
            </Toolbar>

            <div className="flex-1 overflow-auto bg-background">
              <EditorContent
                editor={editor}
                role="presentation"
                className="fullscreen-editor-content"
              />
            </div>
          </EditorContext.Provider>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}

