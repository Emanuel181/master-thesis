import React from 'react';

export const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-neutral-800 text-neutral-400 border-neutral-700",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    };

    return (
        <div className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};