"use client";

export function FeaturedPostSidebarItem({
  imageSrc,
  imageAlt,
  title,
  href,
  category,
  icon,
}) {
  return (
    <a href={href} className="group flex items-center gap-4 p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="aspect-square w-14 h-14 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div
          className="aspect-square w-14 h-14 rounded-lg shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, 
              rgba(var(--brand-accent-rgb), 0.15) 0%, 
              rgba(var(--brand-primary-rgb), 0.25) 100%)`,
          }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {category && (
          <span className="text-xs text-[var(--brand-accent)] font-medium">{category}</span>
        )}
        <h4 className="text-sm leading-snug font-medium line-clamp-2 group-hover:text-[var(--brand-accent)] transition-colors">
          {title}
        </h4>
      </div>
    </a>
  );
}

