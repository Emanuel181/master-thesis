"use client";

import React from "react";
import {
    BaseEdge,
    getSmoothStepPath,
} from "reactflow";

/**
 * Custom Animated SVG Edge for React Flow
 */
export function AnimatedSVGEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    labelStyle,
    data,
}) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const circleColor = style.stroke || "#3b82f6";
    const duration = data?.duration || "3s";

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
            {label && (
                <text>
                    <textPath
                        href={`#${id}`}
                        startOffset="50%"
                        textAnchor="middle"
                        style={labelStyle}
                    >
                        {label}
                    </textPath>
                </text>
            )}
            <circle r="6" fill={circleColor} opacity="0.8">
                <animateMotion dur={duration} repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
}

