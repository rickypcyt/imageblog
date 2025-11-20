'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  history: {x: number, y: number}[];
}

export default function WavyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const hueRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spacing = 22; // Slightly increased spacing
    const dotRadius = 1.8; // Slightly smaller dots
    const influenceRadius = 150; // Smaller influence area
    const returnSpeed = 0.1; // Faster return to original position
    const attractStrength = 0.25; // Stronger attraction for better performance
    const gravity = 0.15; // Slightly more gravity
    const friction = 0.88; // More friction for faster settling
    const trailLength = 2; // Reduced trail length for better performance

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
            history: [],
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
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update time and hue for color cycling
      timeRef.current += 0.005;
      hueRef.current = (hueRef.current + 0.2) % 360;
      const waveIntensity = Math.sin(timeRef.current) * 0.5 + 0.5; // 0 to 1
      
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;


      for (const dot of dotsRef.current) {
        const dx = mx - dot.x;
        const dy = my - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Simple cursor influence without highlight
        if (dist < influenceRadius) {
          const influence = 1 - (dist / influenceRadius);
          const force = influence * influence * attractStrength;
          
          // Move dots away from cursor
          dot.vx += (dx / dist) * force;
          dot.vy += (dy / dist) * force;
        }

        // Faster return to origin with simpler calculation
        const homeX = dot.ox - dot.x;
        const homeY = dot.oy - dot.y;
        
        // Stronger, more direct return force
        dot.vx += homeX * returnSpeed * 0.15;
        dot.vy += homeY * returnSpeed * 0.15;

        // Apply gentle gravity
        dot.vy += gravity * 0.7; // Reduced gravity
        
        // Apply friction (less friction for more floaty effect)
        dot.vx *= friction * 0.98;
        dot.vy *= friction * 0.98;

        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;
        
        // Optimized trail - only update history every few frames
        if (Math.random() > 0.3) { // Randomly skip some updates for better performance
          dot.history.push({x: dot.x, y: dot.y});
          if (dot.history.length > trailLength) {
            dot.history.shift();
          }
        }

        // Calculate displacement for size
        const displacement = Math.sqrt(
          Math.pow(dot.x - dot.ox, 2) + Math.pow(dot.y - dot.oy, 2)
        );
        // Make size change more subtle with square root for smoother scaling
        const size = dotRadius + Math.sqrt(displacement) * 0.2;

        // Calculate distance from center for wave effect
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const distFromCenter = Math.sqrt(
          Math.pow(dot.x - centerX, 2) + 
          Math.pow(dot.y - centerY, 2)
        );
        
        // Calculate wave effect based on distance and time
        const wave = Math.sin(distFromCenter * 0.02 - timeRef.current * 5) * 0.5 + 0.5;
        const brightness = 40 + wave * 30; // Slightly brighter base
        
        // Draw trail
        if (dot.history.length > 1) {
          for (let i = 0; i < dot.history.length - 1; i++) {
            const alpha = i / dot.history.length;
            const pos = dot.history[i];
            const trailSize = size * (0.3 + alpha * 0.7);
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hueRef.current % 360}, 70%, ${
              brightness * (0.7 + alpha * 0.3)
            }%, ${alpha * 0.4})`;
            ctx.fill();
          }
        }
        
        // Draw the main dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hueRef.current % 360}, 70%, ${brightness}%)`;
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
      style={{ background: '#050505' }}
    />
  );
}