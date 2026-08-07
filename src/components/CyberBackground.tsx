import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vy: number;
  vx: number;
  r: number;
  phase: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let nodes: Node[] = [];
    let particles: Particle[] = [];
    let t = 0;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      nodes = Array.from({ length: 18 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2.5 + 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.012,
      }));

      particles = Array.from({ length: 80 }, () => createParticle());
    };

    const createParticle = (): Particle => ({
      x: Math.random() * (canvas?.width || 1200),
      y: Math.random() * (canvas?.height || 800),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.2 + 0.3,
      life: Math.random() * 100,
      maxLife: 80 + Math.random() * 60,
    });

    const draw = () => {
      t += 0.007;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fine grid — very subtle
      ctx.strokeStyle = 'rgba(0,255,136,0.018)';
      ctx.lineWidth = 0.5;
      const gs = 80;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Node connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 220) {
            const alpha = Math.pow(1 - d / 220, 1.6) * 0.12;
            ctx.strokeStyle = `rgba(0,255,136,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach((n) => {
        n.phase += n.speed;
        const glow = 0.5 + Math.sin(n.phase) * 0.5;

        // Glow halo
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 8 * glow);
        grad.addColorStop(0, `rgba(0,255,136,${0.12 * glow})`);
        grad.addColorStop(1, 'rgba(0,255,136,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(0,255,136,${0.5 + glow * 0.5})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx + Math.sin(t + n.phase) * 0.1;
        n.y += n.vy + Math.cos(t * 0.8 + n.phase) * 0.1;
        if (n.x < -50) n.x = canvas.width + 50;
        if (n.x > canvas.width + 50) n.x = -50;
        if (n.y < -50) n.y = canvas.height + 50;
        if (n.y > canvas.height + 50) n.y = -50;
      });

      // Particles
      particles.forEach((p, i) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.35;
        ctx.fillStyle = progress > 0.7
          ? `rgba(0,255,136,${alpha})`
          : `rgba(168,179,207,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) particles[i] = createParticle();
      });

      // Very subtle horizontal light band
      const scanY = (Math.sin(t * 0.15) * 0.5 + 0.5) * canvas.height;
      const sg = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      sg.addColorStop(0, 'rgba(0,255,136,0)');
      sg.addColorStop(0.5, 'rgba(0,255,136,0.025)');
      sg.addColorStop(1, 'rgba(0,255,136,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY - 60, canvas.width, 120);

      rafRef.current = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener('resize', init);

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
