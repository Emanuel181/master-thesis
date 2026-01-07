"use client";

import React, { useRef, useEffect, useCallback } from "react";

// Grid configuration
const HEX_SIZE = 100;
const GRID_GAP = 40;
const INFLUENCE_RADIUS = 300;
const DECAY_RATE = 0.96;
const MAX_INTENSITY = 0.8;

export function HexGridBackground({ className = "" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const hexagonsRef = useRef([]);
  const lastTimeRef = useRef(0);

  // Hexagon points
  const getHexPoints = useCallback((cx, cy, size) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push({
        x: cx + size * Math.cos(angle),
        y: cy + size * Math.sin(angle),
      });
    }
    return points;
  }, []);

  const initHexagons = useCallback((width, height) => {
    const hexagons = [];
    const hexWidth = HEX_SIZE * Math.sqrt(3) + GRID_GAP;
    const hexHeight = HEX_SIZE * 1.5 + GRID_GAP;
    
    const cols = Math.ceil(width / hexWidth) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * hexWidth + (row % 2 === 0 ? 0 : hexWidth / 2);
        const y = row * hexHeight;
        
        hexagons.push({
          x, y,
          intensity: 0,
          targetIntensity: 0,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    
    return hexagons;
  }, []);

  const drawHexagon = useCallback((ctx, hex, time) => {
    const points = getHexPoints(hex.x, hex.y, HEX_SIZE);
    
    // Subtle breathing animation
    const breathe = Math.sin(time * 0.001 + hex.phase) * 0.1 + 0.9;
    
    // Create gradient stroke along the hexagon perimeter
    // Using brand colors: cyan (#1fb6cf) fading to transparent
    const baseAlpha = 0.1 * breathe;
    
    // Draw each edge with gradient
    for (let i = 0; i < 6; i++) {
      const start = points[i];
      const end = points[(i + 1) % 6];
      
      // Create gradient for this edge
      const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      
      // Alternate gradient direction for flowing effect
      const edgeProgress = (i / 6 + time * 0.0001) % 1;
      const alpha1 = baseAlpha * (0.3 + Math.sin(edgeProgress * Math.PI * 2) * 0.7);
      const alpha2 = baseAlpha * (0.3 + Math.sin((edgeProgress + 0.5) * Math.PI * 2) * 0.7);
      
      gradient.addColorStop(0, `rgba(31, 182, 207, ${alpha1})`);
      gradient.addColorStop(0.5, `rgba(31, 182, 207, ${baseAlpha * 0.5})`);
      gradient.addColorStop(1, `rgba(31, 182, 207, ${alpha2})`);
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hover glow effect
    if (hex.intensity > 0.01) {
      const intensity = hex.intensity;
      
      // Draw full hexagon with glow
      ctx.save();
      ctx.shadowColor = `rgba(31, 182, 207, ${intensity * 0.6})`;
      ctx.shadowBlur = 20 + intensity * 15;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      
      // Animated gradient stroke
      const angle = (time * 0.001 + hex.phase) % (Math.PI * 2);
      const gx = Math.cos(angle) * HEX_SIZE * 1.5;
      const gy = Math.sin(angle) * HEX_SIZE * 1.5;
      
      const glowGradient = ctx.createLinearGradient(
        hex.x - gx, hex.y - gy,
        hex.x + gx, hex.y + gy
      );
      
      // Brand color gradient: cyan to teal
      glowGradient.addColorStop(0, `rgba(31, 182, 207, ${intensity * 0.8})`);
      glowGradient.addColorStop(0.5, `rgba(20, 150, 180, ${intensity * 0.5})`);
      glowGradient.addColorStop(1, `rgba(31, 182, 207, ${intensity * 0.8})`);
      
      ctx.strokeStyle = glowGradient;
      ctx.lineWidth = 1.5 + intensity * 2;
      ctx.stroke();
      ctx.restore();

      // Inner fill glow
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      
      const fillGradient = ctx.createRadialGradient(
        hex.x, hex.y, 0,
        hex.x, hex.y, HEX_SIZE * 0.8
      );
      fillGradient.addColorStop(0, `rgba(31, 182, 207, ${intensity * 0.08})`);
      fillGradient.addColorStop(1, `rgba(31, 182, 207, 0)`);
      ctx.fillStyle = fillGradient;
      ctx.fill();
    }
  }, [getHexPoints]);

  const animate = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    ctx.clearRect(0, 0, width, height);
    
    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;
    const isActive = mouseRef.current.active;
    
    lastTimeRef.current = time;

    hexagonsRef.current.forEach((hex) => {
      const dx = hex.x - mouseX;
      const dy = hex.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < INFLUENCE_RADIUS && isActive) {
        const normalizedDist = distance / INFLUENCE_RADIUS;
        const falloff = Math.pow(1 - normalizedDist, 3);
        hex.targetIntensity = Math.max(hex.targetIntensity, falloff * MAX_INTENSITY);
      }
      
      // Smooth interpolation
      const lerpSpeed = 0.08;
      hex.intensity += (hex.targetIntensity - hex.intensity) * lerpSpeed;
      
      // Decay
      hex.targetIntensity *= DECAY_RATE;
      
      if (hex.intensity < 0.001) hex.intensity = 0;
      if (hex.targetIntensity < 0.001) hex.targetIntensity = 0;
      
      drawHexagon(ctx, hex, time);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [drawHexagon]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    
    hexagonsRef.current = initHexagons(rect.width, rect.height);
  }, [initHexagons]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      
      mouseRef.current = { x, y, active: isInside };
    };

    const handleTouchMove = (e) => {
      const container = containerRef.current;
      if (!container || !e.touches[0]) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      
      mouseRef.current = { x, y, active: isInside };
    };

    const handleLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleResize, animate]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
