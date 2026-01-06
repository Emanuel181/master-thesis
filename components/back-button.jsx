"use client";


export function BackButton({ className, children }) {
  return (
    <button
      onClick={() => window.history.back()}
      className={className}
    >
      {children}
    </button>
  );
}

