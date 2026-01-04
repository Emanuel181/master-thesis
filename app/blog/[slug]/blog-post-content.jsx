"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronLeft,
  Copy,
  Check,
  CheckIcon,
  Share2,
  Link2,
  List,
  ChevronDown,
  ChevronRight,
  Clock,
  CalendarDaysIcon,
  Bookmark,
  BookmarkCheck,
  Mail,
  Minus,
  Plus,
  Type
} from "lucide-react";
import { toast } from "sonner";
import {
  Shield,
  Code,
  Zap,
  Lock,
  AlertTriangle,
  Bug,
  Eye,
  Key,
  Server,
  Database,
  Globe,
  Wifi,
  Terminal,
  FileCode,
  GitBranch,
  Cloud,
  Cpu,
  HardDrive,
} from "lucide-react";

// Map of all available icons for blog posts
const ICON_MAP = {
  Shield,
  Code,
  Zap,
  Lock,
  AlertTriangle,
  Bug,
  Eye,
  Key,
  Server,
  Database,
  Globe,
  Wifi,
  Terminal,
  FileCode,
  GitBranch,
  Cloud,
  Cpu,
  HardDrive,
};

// Blog icon component - renders the appropriate icon based on iconName
function BlogIcon({ iconName, className, style }) {
  const IconComponent = ICON_MAP[iconName] || Shield;
  return <IconComponent className={className} style={style} />;
}

// Helper function to create slug from text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

// Convert TipTap JSON to Markdown
function tiptapJsonToMarkdown(json) {
  if (!json || !json.content) return "";

  const processNode = (node) => {
    if (!node) return "";

    switch (node.type) {
      case "doc":
        return node.content?.map(processNode).join("\n\n") || "";

      case "paragraph":
        return node.content?.map(processNode).join("") || "";

      case "heading": {
        const level = node.attrs?.level || 1;
        const text = node.content?.map(processNode).join("") || "";
        return "#".repeat(level) + " " + text;
      }

      case "text": {
        let text = node.text || "";
        if (node.marks) {
          node.marks.forEach((mark) => {
            switch (mark.type) {
              case "bold":
                text = `**${text}**`;
                break;
              case "italic":
                text = `*${text}*`;
                break;
              case "code":
                text = `\`${text}\``;
                break;
              case "link":
                text = `[${text}](${mark.attrs?.href || ""})`;
                break;
              case "strike":
                text = `~~${text}~~`;
                break;
            }
          });
        }
        return text;
      }

      case "bulletList":
        return node.content?.map((item) => "- " + processNode(item).replace(/^\s+/, "")).join("\n") || "";

      case "orderedList":
        return node.content?.map((item, i) => `${i + 1}. ` + processNode(item).replace(/^\s+/, "")).join("\n") || "";

      case "listItem":
        return node.content?.map(processNode).join("\n") || "";

      case "taskList":
        return node.content?.map(processNode).join("\n") || "";

      case "taskItem": {
        const checked = node.attrs?.checked ? "[x]" : "[ ]";
        return `- ${checked} ` + (node.content?.map(processNode).join("") || "");
      }

      case "codeBlock": {
        const language = node.attrs?.language || "";
        const code = node.content?.map(processNode).join("") || "";
        return "```" + language + "\n" + code + "\n```";
      }

      case "blockquote":
        return node.content?.map((n) => "> " + processNode(n)).join("\n") || "";

      case "horizontalRule":
        return "---";

      case "image": {
        const src = node.attrs?.src || "";
        const alt = node.attrs?.alt || "";
        return `![${alt}](${src})`;
      }

      case "table": {
        if (!node.content) return "";
        const rows = node.content.map((row) => {
          if (row.type !== "tableRow") return "";
          const cells = row.content?.map((cell) => {
            const text = cell.content?.map(processNode).join("") || "";
            return text;
          }) || [];
          return "| " + cells.join(" | ") + " |";
        });
        if (rows.length > 0) {
          const headerSeparator = "| " + rows[0].split("|").slice(1, -1).map(() => "---").join(" | ") + " |";
          return [rows[0], headerSeparator, ...rows.slice(1)].join("\n");
        }
        return rows.join("\n");
      }

      case "hardBreak":
        return "\n";

      default:
        return node.content?.map(processNode).join("") || "";
    }
  };

  return processNode(json);
}

// Extract headings from TipTap JSON
function extractHeadingsFromTiptap(json) {
  if (!json || !json.content) return [];

  const headings = [];

  const processNode = (node) => {
    if (node.type === "heading" && node.attrs?.level >= 2 && node.attrs?.level <= 4) {
      const text = node.content?.map((n) => n.text || "").join("") || "";
      headings.push({
        level: node.attrs.level,
        text: text.trim(),
        id: slugify(text.trim()),
      });
    }
    if (node.content) {
      node.content.forEach(processNode);
    }
  };

  processNode(json);
  return headings;
}

// Extract headings from markdown content
function extractHeadings(content) {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push({
      level,
      text,
      id: slugify(text),
    });
  }

  return headings;
}

// Calculate estimated reading time remaining
function useReadingTimeRemaining(progress, totalReadTime) {
  const totalMinutes = parseInt(totalReadTime) || 10;
  const remaining = Math.ceil(totalMinutes * (1 - progress / 100));
  return remaining > 0 ? remaining : 0;
}

// Hook to track active section based on scroll position
function useActiveSection(headings, scrollRef) {
  const [activeId, setActiveId] = React.useState("");

  React.useEffect(() => {
    if (headings.length === 0) return;

    const scrollContainer = scrollRef?.current;

    const updateActiveSection = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const offset = 120;

      let currentActiveId = "";

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = scrollContainer
            ? rect.top - scrollContainer.getBoundingClientRect().top + scrollTop
            : rect.top + scrollTop;

          if (scrollTop >= elementTop - offset) {
            currentActiveId = heading.id;
          }
        }
      }

      if (currentActiveId) {
        setActiveId(currentActiveId);
      } else if (headings.length > 0) {
        setActiveId(headings[0].id);
      }
    };

    const target = scrollContainer || window;
    target.addEventListener("scroll", updateActiveSection, { passive: true });
    updateActiveSection();

    return () => {
      target.removeEventListener("scroll", updateActiveSection);
    };
  }, [headings, scrollRef]);

  return activeId;
}

// Reading progress hook
function useReadingProgress(scrollRef, contentRef) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const scrollContainer = scrollRef?.current;
    const contentElement = contentRef?.current;

    const updateProgress = () => {
      if (!scrollContainer || !contentElement) {
        setProgress(0);
        return;
      }

      const scrollTop = scrollContainer.scrollTop;
      const containerRect = scrollContainer.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();

      const contentTop = contentRect.top - containerRect.top + scrollTop;
      const contentHeight = contentElement.offsetHeight;
      const viewportHeight = scrollContainer.clientHeight;

      const scrolledIntoContent = scrollTop - contentTop + viewportHeight;
      const totalScrollableContent = contentHeight;

      let newProgress = 0;
      if (scrolledIntoContent > 0) {
        newProgress = (scrolledIntoContent / totalScrollableContent) * 100;
      }

      setProgress(Math.min(100, Math.max(0, newProgress)));
    };

    const target = scrollContainer || window;
    target.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => target.removeEventListener("scroll", updateProgress);
  }, [scrollRef, contentRef]);

  return progress;
}

// Bookmark hook for save for later functionality
function useBookmark(slug) {
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  React.useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('vulniq_blog_bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(slug));
  }, [slug]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('vulniq_blog_bookmarks') || '[]');
    let newBookmarks;

    if (bookmarks.includes(slug)) {
      newBookmarks = bookmarks.filter(b => b !== slug);
      toast.success("Bookmark removed", {
        description: "Article removed from your reading list."
      });
    } else {
      newBookmarks = [...bookmarks, slug];
      toast.success("Bookmarked!", {
        description: "Article saved to your reading list."
      });
    }

    localStorage.setItem('vulniq_blog_bookmarks', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  return { isBookmarked, toggleBookmark };
}

// Font size hook
const DEFAULT_FONT_SIZE = 16;

function useFontSize() {
  const [fontSize, setFontSize] = React.useState(DEFAULT_FONT_SIZE);

  React.useEffect(() => {
    const saved = localStorage.getItem('vulniq_blog_fontsize');
    if (saved) setFontSize(parseInt(saved));
  }, []);

  const adjustFontSize = (delta) => {
    const newSize = Math.min(24, Math.max(14, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem('vulniq_blog_fontsize', newSize.toString());
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    localStorage.removeItem('vulniq_blog_fontsize');
  };

  const isDefault = fontSize === DEFAULT_FONT_SIZE;

  return { fontSize, adjustFontSize, resetFontSize, isDefault };
}

// Sticky Table of Contents sidebar component (collapsible dropdown style)
function StickyTableOfContents({ headings, scrollRef, contentRef, progress, readTime }) {
  const activeId = useActiveSection(headings, scrollRef);
  const tocRef = React.useRef(null);
  const tocScrollRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [tocStyle, setTocStyle] = React.useState({ top: 112, position: 'fixed' });
  const remainingTime = useReadingTimeRemaining(progress, readTime);

  React.useEffect(() => {
    if (!activeId || !tocScrollRef.current || !isExpanded) return;

    const timeoutId = setTimeout(() => {
      const scrollContainer = tocScrollRef.current;
      if (!scrollContainer) return;

      const activeElement = scrollContainer.querySelector(`a[href="#${activeId}"]`);
      if (activeElement) {
        const listItem = activeElement.closest('li');
        const targetElement = listItem || activeElement;
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activeId, isExpanded]);

  React.useEffect(() => {
    const scrollContainer = scrollRef?.current;
    const contentElement = contentRef?.current;
    const tocElement = tocRef?.current;

    if (!scrollContainer || !tocElement) return;

    const updatePosition = () => {
      const topOffset = 112;
      const tocHeight = tocElement.offsetHeight;

      if (contentElement) {
        const contentRect = contentElement.getBoundingClientRect();
        const contentBottom = contentRect.bottom;
        const tocBottom = topOffset + tocHeight;

        if (contentBottom < topOffset) {
          setIsVisible(false);
          return;
        }

        setIsVisible(true);

        const shouldStop = contentBottom < tocBottom + 40;

        if (shouldStop) {
          const adjustment = tocBottom - contentBottom + 40;
          const newTop = Math.max(topOffset - adjustment, -tocHeight + 100);
          setTocStyle({ top: newTop, position: 'fixed' });
        } else {
          setTocStyle({ top: topOffset, position: 'fixed' });
        }
      } else {
        setTocStyle({ top: topOffset, position: 'fixed' });
      }
    };

    scrollContainer.addEventListener("scroll", updatePosition, { passive: true });
    updatePosition();
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [scrollRef, contentRef]);

  if (headings.length === 0) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="hidden xl:block relative">
      <div
        ref={tocRef}
        className={`w-72 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          position: tocStyle.position,
          top: `${tocStyle.top}px`,
          right: 'max(2rem, calc((100vw - 80rem) / 2 + 1rem))'
        }}
      >
        <div className="rounded-2xl border border-zinc-200/80 dark:border-[rgba(var(--brand-accent-rgb),0.2)] bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/80 dark:to-[rgba(var(--brand-primary-rgb),0.2)] overflow-hidden shadow-sm backdrop-blur-sm">
          {/* Header - always visible, clickable to toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(var(--brand-accent-rgb),0.1)] dark:bg-[rgba(var(--brand-accent-rgb),0.15)]">
                <List className="w-4 h-4 text-[var(--brand-accent)]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  On this page
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {headings.filter(h => h.level === 2).length} sections
                </p>
              </div>
            </div>
            <div className="p-1.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50">
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {/* Reading progress - always visible */}
          <div className="px-4 pb-4 border-t border-zinc-200/50 dark:border-zinc-700/30 pt-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              <span>{remainingTime > 0 ? `${remainingTime} min left` : 'Done reading!'}</span>
              <span className="font-semibold text-[var(--brand-accent)]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--brand-accent)] rounded-full"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Expandable TOC content */}
          {isExpanded && (
            <div className="border-t border-zinc-200/80 dark:border-zinc-700/50 overflow-hidden">
              <ScrollArea className="h-[550px]" viewportRef={tocScrollRef}>
                <nav className="p-4">
                  <ul className="space-y-1">
                    {headings.map((heading, index) => {
                      const isActive = activeId === heading.id;
                      const indentLevel = heading.level - 2;
                      const indentPx = indentLevel * 16;

                      return (
                        <li
                          key={index}
                          className="relative"
                          style={{ marginLeft: `${indentPx}px` }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeSection"
                              className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--brand-accent)] rounded-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          <a
                            href={`#${heading.id}`}
                            onClick={(e) => handleClick(e, heading.id)}
                            className={`
                              group/item flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200
                              ${heading.level === 2 ? 'text-sm font-medium' : 'text-xs'}
                              ${isActive 
                                ? "text-[var(--brand-accent)] bg-[rgba(var(--brand-accent-rgb),0.1)] dark:bg-[rgba(var(--brand-accent-rgb),0.15)]" 
                                : heading.level === 2 
                                  ? "text-zinc-700 dark:text-zinc-300 hover:text-[var(--brand-accent)] hover:bg-[rgba(var(--brand-accent-rgb),0.08)] dark:hover:bg-[rgba(var(--brand-accent-rgb),0.1)]" 
                                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50"
                              }
                            `}
                          >
                            {heading.level === 2 ? (
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${
                                isActive 
                                  ? "bg-[var(--brand-accent)] scale-125" 
                                  : "bg-zinc-400 dark:bg-zinc-600 group-hover/item:bg-[var(--brand-accent)]"
                              }`} />
                            ) : (
                              <span className={`w-1 h-1 rounded-full flex-shrink-0 transition-all duration-200 ${
                                isActive 
                                  ? "bg-[var(--brand-accent)]" 
                                  : "bg-zinc-300 dark:bg-zinc-600 group-hover/item:bg-zinc-400 dark:group-hover/item:bg-zinc-500"
                              }`} />
                            )}
                            <span className="leading-snug">{heading.text}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                <ScrollBar />
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Table of Contents (collapsible) - hidden on very small screens, use dock instead
function MobileTableOfContents({ headings, scrollRef, progress, readTime }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeId = useActiveSection(headings, scrollRef);
  const remainingTime = useReadingTimeRemaining(progress, readTime);

  if (headings.length === 0) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    setIsOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="hidden sm:block xl:hidden mb-6 sm:mb-8 rounded-xl sm:rounded-2xl border border-zinc-200/80 dark:border-[rgba(var(--brand-accent-rgb),0.2)] bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/80 dark:to-[rgba(var(--brand-primary-rgb),0.2)] overflow-hidden shadow-sm backdrop-blur-sm"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer group">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-[rgba(var(--brand-accent-rgb),0.1)] dark:bg-[rgba(var(--brand-accent-rgb),0.15)] group-hover:bg-[rgba(var(--brand-accent-rgb),0.15)] dark:group-hover:bg-[rgba(var(--brand-accent-rgb),0.25)] transition-colors">
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-accent)]" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Table of contents
            </p>
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 text-left">
              {headings.filter(h => h.level === 2).length} sections • {remainingTime > 0 ? `${remainingTime} min left` : 'Done!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress indicator */}
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand-accent)] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="p-1.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
            <ChevronDown
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent mb-3 sm:mb-4" />
          <ScrollArea className="max-h-[250px] sm:max-h-[300px]">
            <nav className="pr-2">
              <ul className="space-y-0.5">
                {headings.map((heading, index) => {
                  const isActive = activeId === heading.id;
                  return (
                    <li key={index} className="relative">
                      {heading.level > 2 && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700"
                          style={{ marginLeft: `${(heading.level - 3) * 0.75 + 0.25}rem` }}
                        />
                      )}
                      <a
                        href={`#${heading.id}`}
                        onClick={(e) => handleClick(e, heading.id)}
                        style={{ paddingLeft: `${(heading.level - 2) * 0.75 + 0.5}rem` }}
                        className={`
                          group/item flex items-center gap-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all duration-200
                          ${isActive
                            ? "text-[var(--brand-accent)] bg-[rgba(var(--brand-accent-rgb),0.1)] font-medium"
                            : heading.level === 2 
                              ? "text-zinc-800 dark:text-zinc-200 font-medium hover:text-[var(--brand-accent)] dark:hover:text-white hover:bg-[rgba(var(--brand-accent-rgb),0.08)] dark:hover:bg-[rgba(var(--brand-accent-rgb),0.15)]" 
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50"
                          }
                        `}
                      >
                        {heading.level === 2 && (
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                            isActive ? "bg-[var(--brand-accent)]" : "bg-[var(--brand-accent)] opacity-60 group-hover/item:opacity-100"
                          }`} />
                        )}
                        <span className="line-clamp-1">{heading.text}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <ScrollBar />
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Mobile Reading Dock - Fixed bottom bar showing current section and progress
function MobileReadingDock({ headings, scrollRef, contentRef, newsletterRef, progress, readTime }) {
  const activeId = useActiveSection(headings, scrollRef);
  const remainingTime = useReadingTimeRemaining(progress, readTime);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const tocScrollRef = React.useRef(null);

  // Find current active heading
  const activeHeading = headings.find(h => h.id === activeId);
  const totalSections = headings.filter(h => h.level === 2).length;
  const currentSectionIndex = headings.filter(h => h.level === 2).findIndex(h => h.id === activeId);
  const currentSection = currentSectionIndex >= 0 ? currentSectionIndex + 1 : 1;

  // Track section number for each heading
  let sectionCounter = 0;
  const headingsWithNumbers = headings.map(h => {
    if (h.level === 2) sectionCounter++;
    return { ...h, sectionNum: sectionCounter };
  });

  // Hide dock when user scrolls to newsletter section or past blog content
  React.useEffect(() => {
    const scrollContainer = scrollRef?.current;
    const contentElement = contentRef?.current;
    const newsletterElement = newsletterRef?.current;

    if (!scrollContainer || !contentElement) return;

    const checkVisibility = () => {
      const contentRect = contentElement.getBoundingClientRect();

      // Check if newsletter section is in view (top of newsletter is near or above middle of screen)
      let newsletterInView = false;
      if (newsletterElement) {
        const newsletterRect = newsletterElement.getBoundingClientRect();
        // Hide when newsletter top reaches the bottom third of the viewport
        newsletterInView = newsletterRect.top < window.innerHeight * 0.7;
      }

      // Hide if content bottom is above viewport, content top is below viewport, or newsletter is in view
      const shouldHide = contentRect.bottom < 100 || contentRect.top > window.innerHeight || newsletterInView;
      setIsVisible(!shouldHide);

      // Close expanded state if dock becomes hidden
      if (shouldHide && isExpanded) {
        setIsExpanded(false);
      }
    };

    scrollContainer.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();

    return () => scrollContainer.removeEventListener('scroll', checkVisibility);
  }, [scrollRef, contentRef, newsletterRef, isExpanded]);

  // Auto-scroll to active item in expanded TOC
  React.useEffect(() => {
    if (!isExpanded || !activeId || !tocScrollRef.current) return;

    const activeElement = tocScrollRef.current.querySelector(`[data-heading-id="${activeId}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeId, isExpanded]);

  if (headings.length === 0) return null;

  // Handle TOC item click - always navigate
  const handleTocItemClick = (e, id) => {
    e.preventDefault();
    setIsExpanded(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle dock header click - expand first if collapsed, navigate to current section if expanded
  const handleDockHeaderClick = () => {
    if (!isExpanded) {
      // First click: expand the TOC
      setIsExpanded(true);
    } else {
      // Second click (already expanded): navigate to current section
      setIsExpanded(false);
      const currentId = activeHeading?.id || headings[0]?.id;
      if (currentId) {
        const element = document.getElementById(currentId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return (
    <div
      className={`xl:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Main dock container */}
      <div className="bg-background/98 backdrop-blur-xl border-t border-border/50 shadow-lg rounded-t-2xl overflow-hidden">
        {/* Progress bar at top of dock */}
        <div className="h-1 bg-muted/50">
          <div
            className="h-full bg-[var(--brand-accent)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dock header - always visible */}
        <button
          onClick={handleDockHeaderClick}
          className="w-full flex items-center justify-between px-3 py-2 active:bg-muted/30 transition-colors"
        >
          {/* Current section info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <div className="w-7 h-7 rounded-full bg-[rgba(var(--brand-accent-rgb),0.15)] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[var(--brand-accent)]">
                {currentSection}/{totalSections}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reading</p>
              <p className="text-xs font-medium truncate leading-tight">
                {activeHeading?.text || headings[0]?.text || 'Introduction'}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border/50 mx-2" />

          {/* Progress info */}
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">
              {remainingTime > 0 ? `${remainingTime} min left` : 'Complete'}
            </p>
            <p className="text-xs font-bold text-[var(--brand-accent)]">
              {Math.round(progress)}%
            </p>
          </div>
        </button>

        {/* Expandable TOC section - inline, not overlay */}
        {isExpanded && (
          <div className="border-t border-border/30">
            <ScrollArea className="h-[200px]" viewportRef={tocScrollRef}>
              <nav className="p-2">
                <ul className="space-y-0.5">
                  {headingsWithNumbers.map((heading, index) => {
                    const isActive = activeId === heading.id;
                    const indentLevel = heading.level - 2;

                    return (
                      <li key={index}>
                        <a
                          href={`#${heading.id}`}
                          data-heading-id={heading.id}
                          onClick={(e) => handleTocItemClick(e, heading.id)}
                          style={{ paddingLeft: `${indentLevel * 0.75 + 0.5}rem` }}
                          className={`
                            flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-all duration-200
                            ${isActive
                              ? "text-[var(--brand-accent)] bg-[rgba(var(--brand-accent-rgb),0.12)] font-medium"
                              : "text-foreground hover:bg-muted/80 active:bg-muted"
                            }
                          `}
                        >
                          {heading.level === 2 ? (
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                              isActive 
                                ? "bg-[var(--brand-accent)] text-white" 
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {heading.sectionNum}
                            </span>
                          ) : (
                            <span className={`w-1 h-1 rounded-full flex-shrink-0 ml-2 ${
                              isActive 
                                ? "bg-[var(--brand-accent)]" 
                                : "bg-muted-foreground/40"
                            }`} />
                          )}
                          <span className={`line-clamp-1 ${heading.level === 2 ? 'text-sm' : 'text-xs text-muted-foreground'}`}>
                            {heading.text}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <ScrollBar />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

// Code block component with editor-style interface and syntax highlighting
function CodeBlock({ language, children }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageMap = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    yml: "yaml",
    sh: "bash",
    shell: "bash",
    text: "text",
  };

  const normalizedLanguage = languageMap[language?.toLowerCase()] || language?.toLowerCase() || "text";

  return (
    <div className="my-4 sm:my-6 rounded-lg sm:rounded-xl overflow-hidden border border-zinc-800 bg-[#1e1e1e] dark:bg-[#0d1117] shadow-lg -mx-1 sm:mx-0">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-[#2d2d2d] dark:bg-[#161b22] border-b border-zinc-700">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27ca40]" />
          </div>
          {language && (
            <span className="text-[10px] sm:text-xs text-zinc-400 font-mono uppercase tracking-wide">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-1.5 sm:px-2 py-1 rounded hover:bg-zinc-700"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
      <ScrollArea className="max-h-[400px] sm:max-h-[500px]" type="always">
        <div className="min-w-max">
          <SyntaxHighlighter
            language={normalizedLanguage}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: "0.75rem",
              background: "transparent",
              fontSize: "0.75rem",
              lineHeight: "1.625",
              overflow: "visible",
            }}
            codeTagProps={{
              style: {
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              },
              className: "text-xs sm:text-sm",
            }}
            wrapLines={false}
            wrapLongLines={false}
          >
            {children}
          </SyntaxHighlighter>
        </div>
        <ScrollBar orientation="horizontal" className="h-2 sm:h-2.5" />
        <ScrollBar orientation="vertical" className="w-2 sm:w-2.5" />
      </ScrollArea>
    </div>
  );
}

// Custom components for ReactMarkdown
const createMarkdownComponents = (fontSize) => ({
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    if (!inline && (match || String(children).includes("\n"))) {
      return (
        <CodeBlock language={language}>
          {String(children).replace(/\n$/, "")}
        </CodeBlock>
      );
    }

    return (
      <code
        className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-zinc-100"
        {...props}
      >
        {children}
      </code>
    );
  },

  table({ children }) {
    return (
      <div className="my-6 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <ScrollArea className="w-full" type="auto">
          <div className="min-w-full">
            <table className="w-full text-sm">{children}</table>
          </div>
          <ScrollBar orientation="horizontal" className="h-2.5" />
        </ScrollArea>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        {children}
      </thead>
    );
  },
  tbody({ children }) {
    return (
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {children}
      </tbody>
    );
  },
  tr({ children }) {
    return (
      <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
        {children}
      </tr>
    );
  },
  th({ children }) {
    return (
      <th className="h-10 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="p-4 align-middle text-zinc-900 dark:text-zinc-100">
        {children}
      </td>
    );
  },

  h1({ children }) {
    const id = slugify(String(children));
    return (
      <h1 id={id} className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-8 sm:mt-12 mb-3 sm:mb-4 scroll-mt-20 sm:scroll-mt-24">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    const id = slugify(String(children));
    return (
      <h2 id={id} className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-6 sm:mt-10 mb-3 sm:mb-4 scroll-mt-20 sm:scroll-mt-24">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    const id = slugify(String(children));
    return (
      <h3 id={id} className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-5 sm:mt-8 mb-2 sm:mb-3 scroll-mt-20 sm:scroll-mt-24">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    const id = slugify(String(children));
    return (
      <h4 id={id} className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4 sm:mt-6 mb-2 scroll-mt-20 sm:scroll-mt-24">
        {children}
      </h4>
    );
  },

  p({ children }) {
    return (
      <p style={{ fontSize: `${fontSize}px` }} className="text-zinc-600 dark:text-zinc-400 leading-7 mb-4">
        {children}
      </p>
    );
  },

  ul({ children }) {
    return (
      <ul style={{ fontSize: `${fontSize}px` }} className="my-3 sm:my-4 ml-4 sm:ml-6 list-disc space-y-1.5 sm:space-y-2 text-zinc-600 dark:text-zinc-400 leading-6 sm:leading-7">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol style={{ fontSize: `${fontSize}px` }} className="my-3 sm:my-4 ml-4 sm:ml-6 list-decimal space-y-1.5 sm:space-y-2 text-zinc-600 dark:text-zinc-400 leading-6 sm:leading-7">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-6 sm:leading-7">{children}</li>;
  },

  strong({ children }) {
    return (
      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
        {children}
      </strong>
    );
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },

  a({ href, children }) {
    return (
      <a
        href={href}
        className="text-[var(--brand-accent)] underline underline-offset-4 hover:text-[var(--brand-accent)]/80 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },

  blockquote({ children }) {
    return (
      <blockquote className="my-6 border-l-2 border-[var(--brand-accent)] pl-6 italic text-zinc-600 dark:text-zinc-400">
        {children}
      </blockquote>
    );
  },

  hr() {
    return <hr className="my-8 border-zinc-200 dark:border-zinc-800" />;
  },

  img({ src, alt }) {
    return (
      <figure className="my-8">
        <img
          src={src}
          alt={alt}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 w-full"
          loading="lazy"
        />
        {alt && (
          <figcaption className="mt-2 text-center text-sm text-zinc-500">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },
});


// Related post card component
function RelatedPostCard({ post }) {
  const router = useRouter();

  return (
    <Card
      className="group overflow-hidden cursor-pointer hover:shadow-lg hover:border-[var(--brand-accent)]/30 transition-all duration-300"
      onClick={() => router.push(`/blog/${post.slug}`)}
    >
      <CardContent className="p-0">
        <div className="relative h-32 overflow-hidden">
          {/* Background - either gradient or cover image */}
          {post.coverType === "image" && post.coverImage ? (
            <div
              className="absolute inset-0 transition-transform duration-300 group-hover:scale-105 bg-cover bg-center"
              style={{ backgroundImage: `url(${post.coverImage})` }}
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: post.gradient || `linear-gradient(135deg, rgba(var(--brand-accent-rgb), 0.2) 0%, rgba(var(--brand-primary-rgb), 0.4) 100%)`,
              }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <BlogIcon
              iconName={post.iconName}
              className="w-10 h-10"
              style={{ color: post.iconColor || "rgba(255,255,255,0.8)" }}
            />
          </div>
        </div>
        <div className="p-4 space-y-2">
          <Badge variant="secondary" className="text-xs">
            {post.category}
          </Badge>
          <h3 className="font-semibold line-clamp-2 group-hover:text-[var(--brand-accent)] transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{post.readTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Related posts component
function RelatedPosts({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-16 pt-8 sm:pt-12 border-t border-border/50">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">Related articles</h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <RelatedPostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

// Newsletter CTA component
function NewsletterCTA() {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Thanks for subscribing!", {
      description: "You'll receive our latest security insights."
    });
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <div className="mt-8 sm:mt-12 p-4 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[rgba(var(--brand-accent-rgb),0.1)] to-[rgba(var(--brand-primary-rgb),0.15)] border border-[rgba(var(--brand-accent-rgb),0.2)]">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            Stay updated on security
          </h3>
          <p className="text-sm text-muted-foreground">
            Get the latest vulnerability insights and security best practices delivered to your inbox.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Author bio component
function AuthorBio({ author }) {
  const isVulnIQAuthor = author === "VulnIQ security";

  return (
    <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 ring-2 ring-[var(--brand-accent)]/20">
          <AvatarImage
            src={isVulnIQAuthor ? "/favicon.png" : "/placeholder.svg"}
            alt={author}
          />
          <AvatarFallback>
            {isVulnIQAuthor ? "VQ" : author?.split(" ").map(n => n[0]).join("").slice(0, 2) || "AU"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{author}</h3>
          {isVulnIQAuthor ? (
            <>
              <p className="text-sm text-[var(--brand-accent)] mb-2">@vulniqsecurity</p>
              <p className="text-sm text-muted-foreground">
                VulnIQ helps developers identify and fix security vulnerabilities in their code.
                Our team shares insights on application security, secure coding practices, and vulnerability management.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Community contributor sharing insights on security and development practices.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Breadcrumb component
function Breadcrumbs({ category }) {
  return (
    <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 flex-wrap" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-foreground transition-colors">
        Home
      </Link>
      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <Link href="/blog" className="hover:text-foreground transition-colors">
        Blog
      </Link>
      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="text-[var(--brand-accent)] truncate max-w-[100px] sm:max-w-none">{category}</span>
    </nav>
  );
}

// Font size controls component
function FontSizeControls({ fontSize, adjustFontSize, resetFontSize, isDefault }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 border border-border/50 rounded-full px-2 py-1">
        <button
          onClick={() => adjustFontSize(-2)}
          className="p-1 hover:bg-muted rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Decrease font size"
          disabled={fontSize <= 14}
        >
          <Minus className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-1 sm:gap-1.5 px-1">
          <Type className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground min-w-[24px] sm:min-w-[28px] text-center">
            {fontSize}px
          </span>
        </div>
        <button
          onClick={() => adjustFontSize(2)}
          className="p-1 hover:bg-muted rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Increase font size"
          disabled={fontSize >= 24}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {!isDefault && (
        <button
          onClick={resetFontSize}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-full hover:bg-muted"
          title="Reset to default size"
        >
          Reset
        </button>
      )}
    </div>
  );
}

// JSON-LD Schema component
function ArticleJsonLd({ post, url }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Organization",
      "name": post.author,
      "url": "https://vulniq.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "VulnIQ",
      "logo": {
        "@type": "ImageObject",
        "url": "https://vulniq.com/favicon.png"
      }
    },
    "datePublished": post.date,
    "dateModified": post.updatedDate || post.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "articleSection": post.category,
    "wordCount": post.content?.split(/\s+/).length || 0,
    "timeRequired": post.readTime
  };

  // Safely serialize JSON-LD, escaping </script> to prevent XSS
  const safeJsonLd = JSON.stringify(jsonLd)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd }}
    />
  );
}

// Main Blog Post Content Component
export default function BlogPostContent({ post, relatedPosts }) {
  const router = useRouter();
  const scrollRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const newsletterRef = React.useRef(null);
  const { isBookmarked, toggleBookmark } = useBookmark(post?.slug);
  const { fontSize, adjustFontSize, resetFontSize, isDefault } = useFontSize();
  const progress = useReadingProgress(scrollRef, contentRef);
  const { setForceHideFloating } = useAccessibility();

  // Hide the floating accessibility widget on blog post pages
  React.useEffect(() => {
    setForceHideFloating(true);
    return () => setForceHideFloating(false);
  }, [setForceHideFloating]);

  if (!post) {
    return (
      <ScrollArea className="h-screen">
        <FloatingNavbar />
        <div className="fixed inset-0 mesh-gradient pointer-events-none" />
        <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />
        <main className="min-h-screen bg-transparent pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Post not found
            </h1>
            <p className="text-muted-foreground mb-8">
              The blog post you are looking for does not exist.
            </p>
            <Button onClick={() => router.push("/blog")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to blog
            </Button>
          </div>
        </main>
        <Footer />
      </ScrollArea>
    );
  }

  // Convert TipTap JSON to markdown if needed (for user-submitted articles)
  const contentToRender = React.useMemo(() => {
    if (post.isUserSubmitted && post.contentJson) {
      return tiptapJsonToMarkdown(post.contentJson);
    }
    return post.content || "";
  }, [post.isUserSubmitted, post.contentJson, post.content]);

  // Extract headings - use appropriate method based on content type
  const headings = React.useMemo(() => {
    if (post.isUserSubmitted && post.contentJson) {
      return extractHeadingsFromTiptap(post.contentJson);
    }
    return extractHeadings(post.content || "");
  }, [post.isUserSubmitted, post.contentJson, post.content]);

  const markdownComponents = createMarkdownComponents(fontSize);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://vulniq.com/blog/${post.slug}`;

  return (
    <>
      <ArticleJsonLd post={post} url={currentUrl} />

      <ScrollArea className="h-screen" viewportRef={scrollRef}>
        <FloatingNavbar />

        {/* Background patterns */}
        <div className="fixed inset-0 mesh-gradient pointer-events-none" />
        <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

        <main className="min-h-screen bg-transparent pt-20 sm:pt-24 md:pt-28 pb-24 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Two-column layout: content + sticky TOC */}
            <div className="flex gap-6 lg:gap-8 xl:gap-12">
              {/* Main content column */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 w-full max-w-3xl mx-auto xl:mx-0"
              >
                {/* Breadcrumbs */}
                <Breadcrumbs category={post.category} />

                {/* Hero title section with gradient background */}
                <div className="relative -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 mb-6 sm:mb-8 md:mb-10 rounded-xl sm:rounded-2xl overflow-hidden">
                  {/* Background - either gradient or cover image */}
                  {post.coverType === "image" && post.coverImage ? (
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${post.coverImage})` }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{
                        background: post.gradient || `linear-gradient(135deg, 
                          rgba(var(--brand-accent-rgb), 0.3) 0%, 
                          rgba(var(--brand-primary-rgb), 0.5) 50%,
                          rgba(var(--brand-accent-rgb), 0.3) 100%)`,
                      }}
                    />
                  )}

                  {/* Icon with position and color support */}
                  <div
                    className={cn(
                      "absolute inset-0 flex opacity-15",
                      // Icon position classes
                      post.iconPosition === "top-left" && "items-start justify-start p-8",
                      post.iconPosition === "top-center" && "items-start justify-center pt-8",
                      post.iconPosition === "top-right" && "items-start justify-end p-8",
                      post.iconPosition === "center-left" && "items-center justify-start pl-8",
                      (!post.iconPosition || post.iconPosition === "center") && "items-center justify-center",
                      post.iconPosition === "center-right" && "items-center justify-end pr-8",
                      post.iconPosition === "bottom-left" && "items-end justify-start p-8",
                      post.iconPosition === "bottom-center" && "items-end justify-center pb-8",
                      post.iconPosition === "bottom-right" && "items-end justify-end p-8",
                    )}
                  >
                    <BlogIcon
                      iconName={post.iconName}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
                      style={{ color: post.iconColor || "white" }}
                    />
                  </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                      <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
                          <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Published on {post.date}</span>
                          {post.updatedDate && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Updated {post.updatedDate}</span>
                            </>
                          )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight max-w-2xl">
                          {post.title}
                        </h1>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-fit">
                              <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-offset-background ring-2 ring-white/50 ring-offset-2 ring-offset-transparent">
                                <AvatarImage
                                  src={post.author === "VulnIQ security" ? "/favicon.png" : "/placeholder.svg"}
                                  alt={post.author}
                                />
                                <AvatarFallback className="text-xs bg-[var(--brand-primary)]">
                                  {post.author === "VulnIQ security" ? "VQ" : post.author?.split(" ").map(n => n[0]).join("").slice(0, 2) || "AU"}
                                </AvatarFallback>
                              </Avatar>
                              {post.author === "VulnIQ security" && (
                                <span className="absolute -right-1 -bottom-1 inline-flex size-3 sm:size-4 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
                                  <CheckIcon className="size-2 sm:size-2.5 text-white" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm sm:text-base font-medium text-white">{post.author}</p>
                              {post.author === "VulnIQ security" ? (
                                <p className="text-xs sm:text-sm text-white/70">@vulniqsecurity</p>
                              ) : (
                                <p className="text-xs sm:text-sm text-white/70">Community Author</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-white/80">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">{post.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                {/* Reading controls bar */}
                <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 p-2 sm:p-3 rounded-xl bg-muted/30 border border-border/50">
                  <FontSizeControls
                    fontSize={fontSize}
                    adjustFontSize={adjustFontSize}
                    resetFontSize={resetFontSize}
                    isDefault={isDefault}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleBookmark}
                    className={`h-8 px-2 sm:px-3 ${isBookmarked ? "text-[var(--brand-accent)]" : ""}`}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 sm:mr-1.5" />
                    ) : (
                      <Bookmark className="w-4 h-4 sm:mr-1.5" />
                    )}
                    <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>

                {/* Excerpt as intro paragraph */}
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed sm:leading-8 mb-6 sm:mb-8">
                  {post.excerpt}
                </p>

                {/* Mobile Table of Contents */}
                <MobileTableOfContents
                  headings={headings}
                  scrollRef={scrollRef}
                  progress={progress}
                  readTime={post.readTime}
                />

                {/* Blog Content in styled container */}
                <div
                  ref={contentRef}
                  className="prose-content rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:border-[rgba(var(--brand-accent-rgb),0.15)] bg-white dark:bg-zinc-900/50 dark:bg-[rgba(var(--brand-primary-rgb),0.3)] p-6 md:p-8 lg:p-10 shadow-sm backdrop-blur-sm"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {contentToRender}
                  </ReactMarkdown>
                </div>

                {/* Author bio */}
                <AuthorBio author={post.author} />

                {/* Newsletter CTA */}
                <div ref={newsletterRef}>
                  <NewsletterCTA />
                </div>

                {/* Related posts */}
                <RelatedPosts posts={relatedPosts} />

                {/* Bottom action bar */}
                <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Link
                    href="/blog"
                    className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    All posts
                  </Link>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 sm:px-3 gap-1.5 border-border/50 hover:border-[var(--brand-accent)] hover:bg-[rgba(var(--brand-accent-rgb),0.1)] hover:text-[var(--brand-accent)] transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied!");
                      }}
                    >
                      <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-xs">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 sm:px-3 gap-1.5 border-border/50 hover:border-[var(--brand-accent)] hover:bg-[rgba(var(--brand-accent-rgb),0.1)] hover:text-[var(--brand-accent)] transition-all"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: post.title,
                            text: post.excerpt,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied!");
                        }
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-xs">Share</span>
                    </Button>
                  </div>
                </div>
              </motion.article>

              {/* Sticky Table of Contents sidebar */}
              <StickyTableOfContents
                headings={headings}
                scrollRef={scrollRef}
                contentRef={contentRef}
                progress={progress}
                readTime={post.readTime}
              />
            </div>
          </div>
        </main>

        {/* Extra padding for mobile dock */}
        <div className="h-20 sm:hidden" />

        <Footer />

        {/* Mobile Reading Dock - only visible on small screens */}
        <MobileReadingDock
          headings={headings}
          scrollRef={scrollRef}
          contentRef={contentRef}
          newsletterRef={newsletterRef}
          progress={progress}
          readTime={post.readTime}
        />
      </ScrollArea>
    </>
  );
}

