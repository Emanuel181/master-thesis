"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

export function PointerHighlight({
                                     children,
                                     rectangleClassName,
                                     pointerClassName,
                                     containerClassName,
                                 }) {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setDimensions({ width, height });
            setIsVisible(true);
        }

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    return (
        <span
            className={cn("relative inline-flex items-center", containerClassName)}
            ref={containerRef}
        >

      {/* Ensure text is above the border */}
            <span className="relative z-10">{children}</span>

      <AnimatePresence>
        {isVisible && dimensions.width > 0 && (
            <motion.div
                className="pointer-events-none absolute top-0 left-0 z-0"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                {/* The Rectangle Border */}
                <motion.div
                    className={cn(
                        "absolute top-0 left-0 border border-neutral-200 dark:border-white/40 rounded-sm",
                        rectangleClassName
                    )}
                    initial={{
                        width: 0,
                        height: 0,
                    }}
                    whileInView={{
                        width: dimensions.width + 8,
                        height: dimensions.height,
                    }}
                    transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.2, // Small delay so text reads first
                    }}
                />

                {/* The Mouse Pointer */}
                <motion.div
                    className="absolute will-change-transform"
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    whileInView={{
                        opacity: 1,
                        x: dimensions.width + 8, // Adjust to stick to corner
                        y: dimensions.height ,
                    }}
                    transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.2,
                    }}
                >
                    <Pointer
                        className={cn(
                            "h-5 w-5 text-blue-500 fill-blue-500 stroke-white",
                            pointerClassName
                        )}
                    />
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </span>
    );
}

const Pointer = ({ className, ...props }) => {
    return (
        <svg
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
    );
};