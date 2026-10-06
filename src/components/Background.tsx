import { useEffect, useRef } from "react";
import { pointer } from "../hooks/usePointer";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  depth: number;
}

/** Drifting node network that bends around the cursor and parallaxes with scroll. */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0,
      h = 0,
      raf = 0,
      pts: P[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let scrollY = window.scrollY,
      smoothScroll = scrollY;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.floor((w * h) / 14000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.5,
        depth: Math.random() * 0.8 + 0.2,
      }));
    };

    const onScroll = () => (scrollY = window.scrollY);
    const LINK = 140;
    const REACH = 180;

    const frame = () => {
      smoothScroll += (scrollY - smoothScroll) * 0.08;
      ctx.clearRect(0, 0, w, h);
      const mx = pointer.px,
        my = pointer.py;

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        if (pointer.active) {
          const dx = p.x - mx,
            dy = p.y - my,
            d = Math.hypot(dx, dy);
          if (d < REACH && d > 0.1) {
            const f = (1 - d / REACH) * 1.6;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
      }

      const oy = (p: P) => -smoothScroll * 0.15 * p.depth;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const ay = a.y + oy(a);
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const by = b.y + oy(b);
          const d = Math.hypot(a.x - b.x, ay - by);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(110,200,255,${(1 - d / LINK) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, ay);
            ctx.lineTo(b.x, by);
            ctx.stroke();
          }
        }
        if (pointer.active) {
          const d = Math.hypot(a.x - mx, ay - my);
          if (d < REACH) {
            ctx.strokeStyle = `rgba(94,234,212,${(1 - d / REACH) * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(a.x, ay);
            ctx.lineTo(mx, my);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(190,225,255,${0.35 + a.depth * 0.4})`;
        ctx.beginPath();
        ctx.arc(a.x, ay, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (reduce) frame(), cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={ref} className="bg-canvas" aria-hidden />;
}
