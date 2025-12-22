"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RippleGridProps {
    enableRainbow?: boolean;
    gridColor?: string;
    rippleIntensity?: number;
    gridSize?: number;
    gridThickness?: number;
    mouseInteraction?: boolean;
    mouseInteractionRadius?: number;
    opacity?: number;
    className?: string;
}

const RippleGrid: React.FC<RippleGridProps> = ({
    enableRainbow = false,
    gridColor = "#ffffff",
    rippleIntensity = 0.05,
    gridSize = 10,
    gridThickness = 1, // Interpreted as transparency or stroke, but usually size. I'll stick to a standard fill.
    mouseInteraction = true,
    mouseInteractionRadius = 1.2, // Multiplier of grid size? or pure pixels? Let's assume proportional.
    opacity = 0.8,
    className,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, active: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let hue = 0;

        const handleResize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true,
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        window.addEventListener("resize", handleResize);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        handleResize();

        const draw = () => {
            if (!ctx || !canvas) return;

            // Clear canvas with a very slight fade for trail effect if desired, or hard clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cols = Math.ceil(canvas.width / gridSize);
            const rows = Math.ceil(canvas.height / gridSize);

            if (enableRainbow) {
                hue = (hue + 1) % 360;
            }

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * gridSize;
                    const y = j * gridSize;

                    let cellOpacity = rippleIntensity;
                    let cellColor = gridColor;

                    if (mouseInteraction && mouseRef.current.active) {
                        const dx = mouseRef.current.x - (x + gridSize / 2);
                        const dy = mouseRef.current.y - (y + gridSize / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // Radius calculation
                        const radius = gridSize * 10 * mouseInteractionRadius;

                        if (distance < radius) {
                            const fade = 1 - distance / radius;
                            cellOpacity += fade * opacity;

                            if (enableRainbow) {
                                // Vary hue based on position for a nice wave look
                                const waveHue = (hue + (distance * 0.5)) % 360;
                                cellColor = `hsl(${waveHue}, 80%, 60%)`;
                            }
                        }
                    }

                    if (enableRainbow && !mouseInteraction) {
                        // Ambient rainbow if no mouse interaction required
                    }

                    ctx.fillStyle = enableRainbow && mouseRef.current.active
                        ? cellColor
                        : hexToRgba(gridColor, cellOpacity);

                    // Draw small dots or squares. Let's do small squares with gaps to look like a grid
                    const size = gridSize * 0.8; // 80% fill
                    const offset = (gridSize - size) / 2;

                    ctx.fillRect(x + offset, y + offset, size, size);
                }
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", handleResize);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationId);
        };
    }, [enableRainbow, gridColor, rippleIntensity, gridSize, gridThickness, mouseInteraction, mouseInteractionRadius, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("w-full h-full block", className)}
        />
    );
};

// Helper: Simple Hex to RGBA
function hexToRgba(hex: string, alpha: number) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

export default RippleGrid;
