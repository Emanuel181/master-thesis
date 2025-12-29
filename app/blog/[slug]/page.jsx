"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronLeft, Copy, Check, CheckIcon, Share2, Link2, FileText, List, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getBlogPost } from "@/lib/blog-data";

// Helper function to create slug from text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
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

// Table of Contents component (collapsible)
function TableOfContents({ headings }) {
  const [isOpen, setIsOpen] = React.useState(true);
  
  if (headings.length === 0) return null;
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-8 rounded-2xl border border-zinc-200/80 dark:border-[rgba(var(--brand-accent-rgb),0.2)] bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/80 dark:to-[rgba(var(--brand-primary-rgb),0.2)] overflow-hidden shadow-sm backdrop-blur-sm"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-5 hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(var(--brand-accent-rgb),0.1)] dark:bg-[rgba(var(--brand-accent-rgb),0.15)] group-hover:bg-[rgba(var(--brand-accent-rgb),0.15)] dark:group-hover:bg-[rgba(var(--brand-accent-rgb),0.25)] transition-colors">
            <List className="w-4 h-4 text-[var(--brand-accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Table of contents
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
              {headings.length} section{headings.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
          <ChevronDown 
            className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-5 pb-5">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent mb-4" />
          <nav>
            <ul className="space-y-0.5">
              {headings.map((heading, index) => (
                <li
                  key={index}
                  className="relative"
                >
                  {heading.level > 2 && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700"
                      style={{ marginLeft: `${(heading.level - 3) * 1 + 0.5}rem` }}
                    />
                  )}
                  <a
                    href={`#${heading.id}`}
                    style={{ paddingLeft: `${(heading.level - 2) * 1 + 0.5}rem` }}
                    className={`
                      group/item flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all duration-200
                      ${heading.level === 2 
                        ? "text-zinc-800 dark:text-zinc-200 font-medium hover:text-[var(--brand-accent)] dark:hover:text-white hover:bg-[rgba(var(--brand-accent-rgb),0.08)] dark:hover:bg-[rgba(var(--brand-accent-rgb),0.15)]" 
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50"
                      }
                    `}
                  >
                    {heading.level === 2 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] opacity-60 group-hover/item:opacity-100 transition-opacity" />
                    )}
                    <span className="truncate">{heading.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </CollapsibleContent>
    </Collapsible>
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

  // Map common language aliases
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
    <div className="my-6 rounded-xl overflow-hidden border border-zinc-800 bg-[#1e1e1e] dark:bg-[#0d1117] shadow-lg">
      {/* Editor header with macOS-style buttons */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] dark:bg-[#161b22] border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
          </div>
          {language && (
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wide">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content with syntax highlighting and ScrollArea */}
      <ScrollArea className="max-h-[500px]" type="always">
        <div className="min-w-max">
          <SyntaxHighlighter
            language={normalizedLanguage}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: "1rem",
              background: "transparent",
              fontSize: "0.875rem",
              lineHeight: "1.625",
              overflow: "visible",
            }}
            codeTagProps={{
              style: {
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              },
            }}
            wrapLines={false}
            wrapLongLines={false}
          >
            {children}
          </SyntaxHighlighter>
        </div>
        <ScrollBar orientation="horizontal" className="h-2.5" />
        <ScrollBar orientation="vertical" className="w-2.5" />
      </ScrollArea>
    </div>
  );
}

// Custom components for ReactMarkdown - clean prose styling
const markdownComponents = {
  // Code blocks
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

    // Inline code
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-zinc-100"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Tables with shadcn styling and ScrollArea
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

  // Headings with anchor IDs
  h1({ children }) {
    const id = slugify(String(children));
    return (
      <h1 id={id} className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-12 mb-4 scroll-mt-24">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    const id = slugify(String(children));
    return (
      <h2 id={id} className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-10 mb-4 scroll-mt-24">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    const id = slugify(String(children));
    return (
      <h3 id={id} className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3 scroll-mt-24">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    const id = slugify(String(children));
    return (
      <h4 id={id} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-2 scroll-mt-24">
        {children}
      </h4>
    );
  },

  // Paragraphs
  p({ children }) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400 leading-7 mb-4">
        {children}
      </p>
    );
  },

  // Lists
  ul({ children }) {
    return (
      <ul className="my-4 ml-6 list-disc space-y-2 text-zinc-600 dark:text-zinc-400 leading-7">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="my-4 ml-6 list-decimal space-y-2 text-zinc-600 dark:text-zinc-400 leading-7">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-7">{children}</li>;
  },

  // Strong and emphasis
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

  // Links
  a({ href, children }) {
    return (
      <a
        href={href}
        className="text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },

  // Blockquotes
  blockquote({ children }) {
    return (
      <blockquote className="my-6 border-l-2 border-zinc-300 dark:border-zinc-600 pl-6 italic text-zinc-600 dark:text-zinc-400">
        {children}
      </blockquote>
    );
  },

  // Horizontal rules
  hr() {
    return <hr className="my-8 border-zinc-200 dark:border-zinc-800" />;
  },

  // Images
  img({ src, alt }) {
    return (
      <figure className="my-8">
        <img
          src={src}
          alt={alt}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        />
        {alt && (
          <figcaption className="mt-2 text-center text-sm text-zinc-500">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const post = getBlogPost(params.slug);

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

  return (
    <ScrollArea className="h-screen">
      <FloatingNavbar />

      {/* Background patterns */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

      <main className="min-h-screen bg-transparent pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* See all posts link */}
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            See all posts
          </Link>

          {/* Published date */}
          <p className="text-sm text-muted-foreground mb-3">
            Published on {post.date}
          </p>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-10 pb-10 border-b border-border/50">
            <div className="relative w-fit">
              <Avatar className="ring-offset-background ring-2 ring-[var(--brand-accent)] ring-offset-2">
                <AvatarImage src="/favicon.png" alt="VulnIQ security" />
                <AvatarFallback className="text-xs bg-[var(--brand-primary)]">VQ</AvatarFallback>
              </Avatar>
              <span className="absolute -right-1 -bottom-1 inline-flex size-4 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
                <CheckIcon className="size-2.5 text-white" />
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">VulnIQ security</p>
              <p className="text-sm text-muted-foreground">@vulniqsecurity</p>
            </div>
          </div>

          {/* Excerpt as intro paragraph */}
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-8 mb-8">
            {post.excerpt}
          </p>

          {/* Table of Contents */}
          <TableOfContents headings={extractHeadings(post.content)} />

          {/* Blog Content in styled container */}
          <div className="prose-content rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:border-[rgba(var(--brand-accent-rgb),0.15)] bg-white dark:bg-zinc-900/50 dark:bg-[rgba(var(--brand-primary-rgb),0.3)] p-6 md:p-8 lg:p-10 shadow-sm backdrop-blur-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* See all posts link at bottom */}
          <div className="mt-16 pt-8 border-t border-border/50 flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              See all posts
            </Link>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border/50 hover:border-[var(--brand-accent)] hover:bg-[rgba(var(--brand-accent-rgb),0.1)] hover:text-[var(--brand-accent)] transition-all"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!", {
                    description: "The page URL has been copied to your clipboard.",
                  });
                }}
              >
                <Link2 className="w-4 h-4" />
                Copy link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border/50 hover:border-[var(--brand-accent)] hover:bg-[rgba(var(--brand-accent-rgb),0.1)] hover:text-[var(--brand-accent)] transition-all"
                onClick={() => {
                  const contentToCopy = `${post.title}\n\n${post.excerpt}\n\n${post.content}`;
                  navigator.clipboard.writeText(contentToCopy);
                  toast.success("Content copied!", {
                    description: "The article title and content have been copied to your clipboard.",
                  });
                }}
              >
                <FileText className="w-4 h-4" />
                Copy content
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border/50 hover:border-[var(--brand-accent)] hover:bg-[rgba(var(--brand-accent-rgb),0.1)] hover:text-[var(--brand-accent)] transition-all"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.excerpt,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!", {
                      description: "Share not supported, link copied to clipboard instead.",
                    });
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </motion.article>
      </main>

      <Footer />
    </ScrollArea>
  );
}
