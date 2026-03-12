import React, { useEffect, useRef } from 'react';

export const SlitheringSnake: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let head = { x: 100, y: 100 };
        let target = { x: 300, y: 300 };
        const segments: { x: number; y: number }[] = [];
        const length = 20;
        const speed = 2;
        const segmentDist = 8;

        // Initialize segments
        for (let i = 0; i < length; i++) {
            segments.push({ ...head });
        }

        const getNewTarget = (w: number, h: number) => {
            target = {
                x: Math.random() * (w - 100) + 50,
                y: Math.random() * (h - 100) + 50
            };
        };

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            getNewTarget(canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            // Move head towards target
            const dx = target.x - head.x;
            const dy = target.y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                getNewTarget(w, h);
            } else {
                head.x += (dx / dist) * speed;
                head.y += (dy / dist) * speed;
            }

            // Record head
            segments.unshift({ ...head });
            if (segments.length > length * segmentDist) {
                segments.pop();
            }

            // Get foreground color from CSS
            const style = getComputedStyle(canvas);
            const fg = style.getPropertyValue('--foreground').trim();

            // Draw segments
            for (let i = 0; i < length; i++) {
                const index = i * segmentDist;
                if (index >= segments.length) break;

                const point = segments[index];
                const opacity = 1 - (i / length) * 0.8; // Fades out towards tail
                const size = 6 - (i / length) * 3; // Gets smaller towards tail

                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${fg} / ${opacity * 0.15})`;
                ctx.fill();

                // Add a subtle glow
                if (i === 0) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = `hsl(${fg} / 0.05)`;
                    ctx.fill();
                }
            }

            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    );
};
