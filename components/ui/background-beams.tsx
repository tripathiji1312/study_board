"use client";
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    const beamsRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = beamsRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const beams = Array.from({ length: 4 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            dx: (Math.random() - 0.5) * 1.5,
            dy: (Math.random() - 0.5) * 1.5,
            opacity: Math.random() * 0.5 + 0.1,
        }));

        const render = () => {
            if (!canvas || !ctx) return;

            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a soft gradient background
            // ctx.fillStyle = "rgba(10, 10, 20, 0.8)"; 
            // This is handled by parent, we want transparency

            beams.forEach((beam) => {
                beam.x += beam.dx;
                beam.y += beam.dy;

                // Bounce off walls (or wrap around, here we wrap for smoother flow)
                if (beam.x < 0) beam.x = canvas.width;
                if (beam.x > canvas.width) beam.x = 0;
                if (beam.y < 0) beam.y = canvas.height;
                if (beam.y > canvas.height) beam.y = 0;

                const gradient = ctx.createRadialGradient(
                    beam.x,
                    beam.y,
                    0,
                    beam.x,
                    beam.y,
                    400 // Large radius for soft beam look
                );

                gradient.addColorStop(0, `rgba(100, 100, 255, ${beam.opacity * 0.4})`); // Blue-ish
                gradient.addColorStop(0.5, `rgba(150, 50, 200, ${beam.opacity * 0.2})`); // Purple-ish
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(beam.x, beam.y, 400, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={beamsRef}
            className={cn(
                "absolute inset-0 z-0 h-full w-full pointer-events-none opacity-40 mix-blend-screen",
                className
            )}
        />
    );
};
