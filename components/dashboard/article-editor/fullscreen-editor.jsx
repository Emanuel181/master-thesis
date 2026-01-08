"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
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
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
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
import { X, Save, Loader2, Check, Clock, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useSettings } from "@/contexts/settingsContext";

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

const MainToolbarContent = ({ onLinkClick, isMobile }) => {
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

const MobileToolbarContent = ({ onBack }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        <LinkIcon className="tiptap-button-icon" />
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    <LinkContent />
  </>
);

export function FullscreenEditor({ open, onOpenChange, article, onArticleUpdate, apiBasePath = '/api/articles', customHeaders = {}, allowAutosaveAllStatuses = false }) {

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
  const [mounted, setMounted] = useState(false);
  const themeButtonRef = useRef(null);
  const fetchedArticleId = useRef(null); // Track which article was fetched
  const customHeadersRef = useRef(customHeaders); // Ref to avoid callback recreation
  const articleRef = useRef(article); // Ref to always have latest article data
  const saveContentRef = useRef(null); // Ref for save function to use in interval

  // Keep refs updated
  useEffect(() => {
    customHeadersRef.current = customHeaders;
  }, [customHeaders]);

  useEffect(() => {
    articleRef.current = article;
  }, [article]);

  // Theme toggle using settings context
  const { settings, updateSettings } = useSettings();

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!settings || !themeButtonRef.current) return;

    const newMode = settings.mode === "dark" ? "light" : "dark";

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback for browsers without View Transitions API
      updateSettings({ ...settings, mode: newMode });
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        updateSettings({ ...settings, mode: newMode });
      });
    }).ready;

    const { top, left, width, height } = themeButtonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 400,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [settings, updateSettings]);

  const isDarkMode = mounted && settings?.mode === "dark";

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
        fetchedArticleId.current = null; // Reset so next open will fetch
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Fetch content when dialog opens
  useEffect(() => {
    // Only fetch if open, have article id, and haven't already fetched this article
    if (open && article?.id && fetchedArticleId.current !== article.id) {
      setIsLoading(true);
      fetchedArticleId.current = article.id; // Mark as fetching
      const url = `${apiBasePath}/${article.id}/content`;

      fetch(url, {
        headers: customHeaders,
      })
        .then((res) => res.json())
        .then((data) => {
          // Use contentJson if available, otherwise try to use content
          if (data.contentJson) {
            setInitialContent(data.contentJson);
          } else {
            setInitialContent(null);
          }
        })
        .catch((error) => {
          console.error("Error fetching content:", error);
          toast.error("Failed to load article content");
          fetchedArticleId.current = null; // Reset on error so retry is possible
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, article?.id, apiBasePath]);

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
    const currentArticle = articleRef.current;

    if (!editor || !currentArticle?.id) {
      return;
    }

    if (!hasUnsavedChanges.current) {
      return;
    }

    try {
      setSaveStatus("saving");

      const json = editor.getJSON();
      const html = generateHTML(json);
      const text = generateText(json);

      const response = await fetch(`${apiBasePath}/${currentArticle.id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...customHeadersRef.current },
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
      if (data.readTime && onArticleUpdate) {
        onArticleUpdate({ id: currentArticle.id, readTime: data.readTime });
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
  }, [editor, apiBasePath, onArticleUpdate]);

  // Keep saveContentRef updated
  useEffect(() => {
    saveContentRef.current = saveContent;
  }, [saveContent]);


  // Manual save
  const handleManualSave = () => {
    hasUnsavedChanges.current = true;
    saveContent();
  };

  // Save on close
  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges.current) {
      await saveContent();
      toast.success("Content saved.");
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

  // Autosave every 30 seconds (only for draft articles when editor is open, unless allowAutosaveAllStatuses is true)
  useEffect(() => {
    if (!open) {
      return;
    }

    // For regular users, only autosave drafts; for admin (allowAutosaveAllStatuses), autosave all
    const canAutosave = allowAutosaveAllStatuses || articleRef.current?.status === "DRAFT";

    if (!canAutosave) {
      return;
    }

    // Set up autosave interval - use ref to always call latest saveContent
    autosaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges.current && saveContentRef.current) {
        saveContentRef.current();
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [open, allowAutosaveAllStatuses]);

  // Save on page close/refresh or tab visibility change (laptop closing, switching tabs)
  useEffect(() => {
    if (!open) return;

    // Save before page unload (closing tab, refreshing, navigating away)
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges.current && saveContentRef.current) {
        // Try to save using fetch with keepalive
        const currentArticle = articleRef.current;
        if (currentArticle?.id) {
          const editorElement = document.querySelector('.fullscreen-editor-content .ProseMirror');
          if (editorElement) {
            const url = `${apiBasePath}/${currentArticle.id}/content`;
            const data = JSON.stringify({
              contentJson: null,
              content: editorElement.innerHTML,
              contentMarkdown: editorElement.innerText,
            });

            const headers = { 'Content-Type': 'application/json', ...customHeadersRef.current };

            fetch(url, {
              method: 'PUT',
              headers,
              body: data,
              keepalive: true,
            }).catch(() => {});
          }
        }

        // Show browser's "unsaved changes" warning
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Save when tab becomes hidden (laptop closing, switching tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges.current && saveContentRef.current) {
        saveContentRef.current();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [open, apiBasePath]);


  // Save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Saving...</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Don't render if not open or not in browser
  if (!open) {
    return null;
  }
  if (typeof document === "undefined") {
    return null;
  }

  const content = (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">


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
        <div className="flex items-center gap-2 sm:gap-4">
          {renderSaveStatus()}
          {/* Last saved time - displayed next to theme toggle */}
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs px-2 py-1.5 rounded-md bg-muted/60 border border-border/50">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">Last saved:</span>
              <span className="font-mono">{lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          <button
            ref={themeButtonRef}
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
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
                  onLinkClick={() => setMobileView("link")}
                  isMobile={isMobile}
                />
              ) : (
                <MobileToolbarContent
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

  // Don't render portal on server
  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(content, document.body);
}

