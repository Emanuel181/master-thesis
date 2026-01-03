"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function BlogPostCard({
  imageSrc,
  imageAlt,
  title,
  description,
  authorName,
  authorAvatarSrc,
  readTime,
  href,
  category,
}) {
  return (
    <a href={href} className="group block">
      <div className="bg-card text-card-foreground overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg hover:border-[var(--brand-accent)]/30">
        <div className="relative overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {category && (
            <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-md bg-[var(--brand-accent)]/90 text-white">
              {category}
            </span>
          )}
        </div>
        <div className="grid gap-2 p-4">
          <h3 className="text-lg leading-tight font-semibold group-hover:text-[var(--brand-accent)] transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-muted-foreground line-clamp-3 text-sm">{description}</p>
          <div className="text-muted-foreground flex items-center gap-2 text-sm pt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatarSrc || "/placeholder.svg"} />
              <AvatarFallback>
                {authorName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span>{authorName}</span>
            <span>•</span>
            <span>{readTime} read</span>
          </div>
        </div>
      </div>
    </a>
  );
}

