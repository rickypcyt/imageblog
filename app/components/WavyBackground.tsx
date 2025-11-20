'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  col: number;
  row: number;
  phase: number;
}

interface State {
  dots: Dot[];
  mouse: { x: number; y: number };
  time: number;
  hue: number;
  animation: number | null;
  breathPhase: number;
  flowOffset: number;
}

export default function WavyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({
    dots: [],
    mouse: { x: -1000, y: -1000 },
    time: 0,
    hue: 200,
    animation: null,
    breathPhase: 0,
    flowOffset: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    const cfg = {
      spacing: 30,
      dotRadius: 1.2,
      influenceRadius: 180,
      returnSpeed: 0.03,
      friction: 0.96
    };

    const initDots = () => {
      s.dots = [];
      const cols = Math.ceil(canvas.width / cfg.spacing) + 1;
      const rows = Math.ceil(canvas.height / cfg.spacing) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          s.dots.push({
            ox: i * cfg.spacing,
            oy: j * cfg.spacing,
            x: i * cfg.spacing,
            y: j * cfg.spacing,
            vx: 0,
            vy: 0,
            col: i,
            row: j,
            phase: Math.random() * Math.PI * 2
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

    const onMove = (x: number, y: number) => { s.mouse.x = x; s.mouse.y = y; };
    const onLeave = () => { s.mouse.x = -1000; s.mouse.y = -1000; };
    
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', onLeave);

    const animate = () => {
      ctx.fillStyle = 'rgba(8,8,15,0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.time += 0.008;
      s.hue = (s.hue + 0.05) % 360;
      s.breathPhase += 0.015;
      s.flowOffset += 0.02;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const breath = Math.sin(s.breathPhase) * 0.5 + 0.5;
      const flowAngle = s.time * 0.3;
      const flowX = Math.cos(flowAngle) * 0.15;
      const flowY = Math.sin(flowAngle) * 0.15;

      for (const d of s.dots) {
        let fx = 0, fy = 0;

        const dx = s.mouse.x - d.x, dy = s.mouse.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cfg.influenceRadius && dist > 0) {
          const f = (1 - dist / cfg.influenceRadius) ** 2 * 0.08;
          fx += (dx / dist) * f * 15;
          fy += (dy / dist) * f * 15;
        }

        const distFromCenter = Math.sqrt((d.ox - cx) ** 2 + (d.oy - cy) ** 2);
        const breathAmount = breath * 0.003 * Math.sin(distFromCenter * 0.008 + s.time);
        fx += (d.ox - cx) * breathAmount;
        fy += (d.oy - cy) * breathAmount;

        const waveVal = Math.sin(d.col * 0.15 + d.row * 0.1 + s.flowOffset) * 2;
        fx += flowX * waveVal;
        fy += flowY * waveVal;

        const drift = Math.sin(s.time * 0.5 + d.phase) * 0.3;
        fy += drift;

        fx += (d.ox - d.x) * cfg.returnSpeed;
        fy += (d.oy - d.y) * cfg.returnSpeed;

        d.vx = (d.vx + fx * 0.1) * cfg.friction;
        d.vy = (d.vy + fy * 0.1) * cfg.friction;
        d.x += d.vx;
        d.y += d.vy;

        const disp = Math.sqrt((d.x - d.ox) ** 2 + (d.y - d.oy) ** 2);
        const size = cfg.dotRadius + Math.min(disp * 0.03, 1);
        
        const waveBrightness = Math.sin(distFromCenter * 0.012 - s.time * 2) * 0.5 + 0.5;
        const brightness = 30 + waveBrightness * 20;
        
        const localHue = (s.hue + d.col * 0.3 + d.row * 0.2) % 360;

        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${localHue}, 50%, ${brightness}%, 0.9)`;
        ctx.fill();

        if (disp > 3) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${localHue}, 60%, 50%, ${Math.min(disp / 80, 0.15)})`;
          ctx.fill();
        }
      }

      s.animation = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', onLeave);
      if (s.animation) cancelAnimationFrame(s.animation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#08080f' }}
    />
  );
}