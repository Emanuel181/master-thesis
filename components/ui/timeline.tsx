"use client";
import {
    useScroll,
    useTransform,
    motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
    title: string;
    content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setHeight(rect.height);
        }
    }, [ref]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 10%", "end 50%"],
    });

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <div
            className="w-full bg-transparent font-sans md:px-10"
            ref={containerRef}
        >
            <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex justify-start pt-10 md:pt-40 md:gap-10"
                    >
                        {/* --- LEFT SIDE: Sticky Title & Bullet --- */}
                        <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">

                            {/* The Bullet Container */}
                            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-neutral-950 flex items-center justify-center">
                                {/* The Pulsing Bullet */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{
                                        opacity: 1,
                                        scale: 1,
                                        // Pulse effect
                                        boxShadow: [
                                            "0 0 0 0px rgba(168, 85, 247, 0)",
                                            "0 0 0 4px rgba(168, 85, 247, 0.5)",
                                            "0 0 0 0px rgba(168, 85, 247, 0)"
                                        ]
                                    }}
                                    transition={{
                                        duration: 0.5, // Entry duration
                                        boxShadow: {
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    viewport={{ once: false, margin: "-100px" }}
                                    className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border border-neutral-700 z-50"
                                />
                            </div>

                            {/* The Title Text (Desktop) */}
                            <motion.div
                                initial={{ opacity: 0.2, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ margin: "-100px" }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="hidden md:block md:pl-20"
                            >
                                <h3 className="text-xl md:text-5xl font-bold text-foreground">
                                    {item.title}
                                </h3>
                            </motion.div>
                        </div>

                        {/* --- RIGHT SIDE: Content --- */}
                        <div className="relative pl-20 pr-4 md:pl-4 w-full">
                            {/* Title (Mobile) */}
                            <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-foreground">
                                {item.title}
                            </h3>

                            {/* The Description & Cards */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ margin: "-100px" }}
                                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                            >
                                {item.content}
                            </motion.div>
                        </div>
                    </div>
                ))}

                {/* --- BACKGROUND LINES --- */}
                <div
                    style={{
                        height: height + "px",
                    }}
                    className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200/10 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
                >
                    <motion.div
                        style={{
                            height: heightTransform,
                            opacity: opacityTransform,
                        }}
                        className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};