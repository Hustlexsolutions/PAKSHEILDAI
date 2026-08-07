import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const checkHover = (e: MouseEvent) => {
      const target = e.target as Element;
      setHovering(
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.closest('[role="button"]') !== null
      );
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mousemove', checkHover);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);

    let animId: number;
    const animate = () => {
      smoothRef.current.x += (posRef.current.x - smoothRef.current.x) * 0.12;
      smoothRef.current.y += (posRef.current.y - smoothRef.current.y) * 0.12;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${smoothRef.current.x - 20}px, ${smoothRef.current.y - 20}px)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${posRef.current.x - 3}px, ${posRef.current.y - 3}px)`;
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousemove', checkHover);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none transition-all duration-150"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1.5px solid rgba(0, 255, 136, ${hovering ? 0.8 : 0.4})`,
          transform: `scale(${clicking ? 0.8 : hovering ? 1.4 : 1})`,
          background: hovering ? 'rgba(0, 255, 136, 0.06)' : 'transparent',
          boxShadow: hovering ? '0 0 15px rgba(0,255,136,0.3)' : 'none',
          transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s',
        }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#00FF88',
          boxShadow: '0 0 6px rgba(0,255,136,0.8)',
        }}
      />
    </>
  );
}
