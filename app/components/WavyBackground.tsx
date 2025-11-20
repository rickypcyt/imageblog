'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function WavyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spacing = 25;
    const dotRadius = 1.5;
    const influenceRadius = 150;
    const returnSpeed = 0.08;
    const attractStrength = 0.15;

    const initDots = () => {
      dotsRef.current = [];
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dotsRef.current.push({
            ox: i * spacing,
            oy: j * spacing,
            x: i * spacing,
            y: j * spacing,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        mouseRef.current.x = touch.clientX;
        mouseRef.current.y = touch.clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouch);
    window.addEventListener('touchend', handleMouseLeave);

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const dot of dotsRef.current) {
        const dx = mx - dot.x;
        const dy = my - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < influenceRadius && dist > 0) {
          const force = (1 - dist / influenceRadius) * attractStrength;
          dot.vx += (dx / dist) * force;
          dot.vy += (dy / dist) * force;
        }

        // Return to origin
        const homeX = dot.ox - dot.x;
        const homeY = dot.oy - dot.y;
        dot.vx += homeX * returnSpeed;
        dot.vy += homeY * returnSpeed;

        // Damping
        dot.vx *= 0.85;
        dot.vy *= 0.85;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Calculate displacement for opacity/size
        const displacement = Math.sqrt(
          Math.pow(dot.x - dot.ox, 2) + Math.pow(dot.y - dot.oy, 2)
        );
        const alpha = Math.min(0.3 + displacement * 0.05, 1);
        const size = dotRadius + displacement * 0.08;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#0a0a0a' }}
    />
  );
}