"use client";
import {
    useScroll,
    useTransform,
    motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export const Timeline = ({ data }) => {
    const ref = useRef(null);
    const containerRef = useRef(null);
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
                        className="flex justify-start pt-10 md:pt-32 md:gap-10"
                    >
                        {/* --- LEFT SIDE: Sticky Title & Bullet --- */}
                        <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">

                            {/* The Bullet Container */}
                            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-[#0a1c27] flex items-center justify-center">
                                {/* The Bullet - with accent glow */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    viewport={{ once: false, margin: "-100px" }}
                                    className="h-3.5 w-3.5 rounded-full bg-[#1fb6cf] border-2 border-background z-50 shadow-lg shadow-[#1fb6cf]/30"
                                />
                            </div>

                            {/* The Title Text (Desktop) */}
                            <motion.div
                                initial={{ opacity: 0.2, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ margin: "-100px" }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="hidden md:block md:pl-20"
                            >
                                <h3 className="text-xl md:text-4xl font-bold text-[#0e2736] dark:text-[#e6f4f7] tracking-[-0.02em]">
                                    {item.title}
                                </h3>
                            </motion.div>
                        </div>

                        {/* --- RIGHT SIDE: Content --- */}
                        <div className="relative pl-20 pr-4 md:pl-4 w-full">
                            {/* Title (Mobile) */}
                            <h3 className="md:hidden block text-2xl mb-4 text-left font-semibold text-[#0e2736] dark:text-[#e6f4f7] tracking-[-0.02em]">
                                {item.title}
                            </h3>

                            {/* The Description & Cards */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ margin: "-100px" }}
                                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
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
                    className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[#1fb6cf]/20 [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
                >
                    <motion.div
                        style={{
                            height: heightTransform,
                            opacity: opacityTransform,
                        }}
                        className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-b from-[#1fb6cf] via-[#1fb6cf] to-[#1fb6cf]/50 rounded-full shadow-sm shadow-[#1fb6cf]/50"
                    />
                </div>
            </div>
        </div>
    );
};