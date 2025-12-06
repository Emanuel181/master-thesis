'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';


export const AgentPointer = ({ x, y, label, color, isVisible, icon: Icon }) => {
    const colors = {
        red: "bg-red-500 border-red-400 ring-red-900/30",
        blue: "bg-blue-500 border-blue-400 ring-blue-900/30",
        emerald: "bg-emerald-500 border-emerald-400 ring-emerald-900/30",
        purple: "bg-purple-600 border-purple-400 ring-purple-900/30",
        orange: "bg-orange-600 border-orange-400 ring-orange-900/30",
    };

    const textColor = color === 'orange' ? 'text-neutral-900' : 'text-white';
    const arrowColor = color === 'red' ? 'text-red-500' :
        color === 'blue' ? 'text-blue-500' :
            color === 'purple' ? 'text-purple-600' :
                color === 'orange' ? 'text-orange-600' :
                    'text-emerald-500';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x, y }}
                    animate={{ opacity: 1, scale: 1, x, y }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="absolute top-0 left-0 z-50 pointer-events-none"
                >
                    <div className={`relative flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl border ring-4 backdrop-blur-md ${colors[color] || colors.blue}`}>
                        <Icon size={16} className={textColor} />
                        <span className={`text-[11px] font-bold whitespace-nowrap ${textColor}`}>{label}</span>
                    </div>
                    <svg
                        className={`absolute -bottom-3 -left-1 w-6 h-6 drop-shadow-md ${arrowColor}`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M5.5 3.21l10.9 12.85c.67.79.23 2.01-.8 2.19l-4.22.74-2.83 5.34c-.26.49-.96.58-1.34.18l-1.3-1.38c-.38-.4-.28-1.07.19-1.34l2.84-5.36-4.14-1.22c-1.01-.3-1.24-1.63-.42-2.27L5.5 3.21z"/>
                    </svg>
                </motion.div>
            )}
        </AnimatePresence>
    );
};