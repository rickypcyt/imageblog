'use client';

import { useEffect, useRef } from 'react';

const WavyBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Initial resize
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Wave parameters
    const wave = {
      y: canvas.height / 2,
      length: 0.01,
      amplitude: 50,
      frequency: 0.01
    };
    
    let increment = 0.01;
    
    const animate = () => {
      if (!ctx) return;
      
      // Clear canvas with semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(30, 30, 40, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw multiple waves
      for (let i = 0; i < 3; i++) {
        drawWave(
          ctx,
          wave.y + i * 40,
          wave.amplitude - i * 10,
          wave.length + i * 0.002,
          wave.frequency + i * 0.001,
          `rgba(255, 255, 255, ${0.3 + i * 0.2})`,
          increment + i * 0.5
        );
      }
      
      increment += 0.01;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    const drawWave = (
      ctx: CanvasRenderingContext2D,
      y: number,
      amplitude: number,
      length: number,
      frequency: number,
      color: string,
      inc: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      for (let i = 0; i < canvas.width; i++) {
        const yPos = y + Math.sin(i * length + inc) * amplitude * Math.sin(inc * frequency);
        ctx.lineTo(i, yPos);
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ backgroundColor: '#1e1e28' }}
    />
  );
};

export default WavyBackground;
