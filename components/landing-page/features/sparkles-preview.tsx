"use client";
import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export function SparklesPreview() {
    return (
        <div className="h-[40rem] w-full bg-transparent flex flex-col items-center justify-center overflow-hidden rounded-md relative">

            <h1 className="md:text-7xl text-5xl lg:text-9xl font-bold text-center text-white relative z-20">
                VulnIQ
            </h1>

            {/* Changed width from fixed w-[40rem] to w-full to span the screen */}
            <div className="w-full h-40 relative">

                {/* Gradients - Adjusted to span full width */}
                <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm mx-auto" />
                <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4 mx-auto" />
                <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm mx-auto" />
                <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4 mx-auto" />

                {/* Core component */}
                <SparklesCore
                    background="transparent"
                    minSize={0.4}
                    maxSize={1}
                    particleDensity={1200}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                />

                {/* Radial Gradient Mask - Widened to 600px/400px to reveal more sparkles across the width */}
                <div className="absolute inset-0 w-full h-full bg-transparent [mask-image:radial-gradient(100%_100%_at_top,transparent_20%,white)]"></div>
            </div>
        </div>
    );
}