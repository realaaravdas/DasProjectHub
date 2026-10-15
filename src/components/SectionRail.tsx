import { useEffect, useRef } from "react";

/**
 * Ruler-style scrollbar with kinetic section titles.
 *
 * - A canvas ruler on the right edge scrolls past a fixed thumb (click / drag to scrub the page).
 * - Section titles are split into letters. The upcoming title waits at the bottom, rotated along the
 *   rail; as its section approaches, the letters swing upright and rise to the top in a staggered
 *   wave, while the previous title shrinks and drifts up.
 */

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "approach", label: "Approach" },
  { id: "contact", label: "Contact" },
];

const RAIL_W = 60;
const PAD_T = 88; // clears the fixed nav
const PAD_B = 28;
const FONT_PX = 34;
const SPACING = 0.05; // em, added between letters
const TOP_Y = 128; // centre line of the active title

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Layout {
  vw: number;
  vh: number;
  docH: number;
  tops: number[];
  widths: number[][]; // per section, per letter
  totals: number[];
}

export default function SectionRail() {
  const rail = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const letters = useRef<HTMLSpanElement[][]>(SECTIONS.map(() => []));
  const links = useRef<HTMLAnchorElement[]>([]);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let L: Layout = { vw: 0, vh: 0, docH: 1, tops: [], widths: [], totals: [] };
    let fs = 0, // smoothed fractional section index
      ps = 0, // smoothed page progress
      lastSy = -1,
      lastT = performance.now(),
      hoverY = -1,
      dragging = false,
      dirty = true,
      raf = 0;

    const measure = () => {
      const m = document.createElement("canvas").getContext("2d")!;
      m.font = `700 ${FONT_PX}px Inter, system-ui, sans-serif`;
      const widths = SECTIONS.map((s) =>
        [...s.label.toUpperCase()].map((ch) => m.measureText(ch).width + FONT_PX * SPACING),
      );
      L = {
        vw: window.innerWidth,
        vh: window.innerHeight,
        docH: document.documentElement.scrollHeight,
        tops: SECTIONS.map((s) => {
          const el = document.getElementById(s.id);
          return el ? el.getBoundingClientRect().top + window.scrollY : 0;
        }),
        widths,
        totals: widths.map((w) => w.reduce((a, b) => a + b, 0) - FONT_PX * SPACING),
      };
      L.tops[0] = 0;
      cv.width = RAIL_W * dpr;
      cv.height = L.vh * dpr;
      cv.style.width = RAIL_W + "px";
      cv.style.height = L.vh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    };

    /** Fractional section index; the hand-over only happens near the end of each section. */
    const sectionFloat = (sy: number, maxS: number) => {
      const a = sy + L.vh * 0.4;
      const n = SECTIONS.length;
      if (sy >= maxS - 2) return n - 1;
      let i = 0;
      for (let k = 0; k < n; k++) if (L.tops[k] <= a) i = k;
      if (i === n - 1) return n - 1;
      const g = (a - L.tops[i]) / Math.max(1, L.tops[i + 1] - L.tops[i]);
      const t = clamp((g - 0.68) / 0.32);
      return i + t * t * (3 - 2 * t);
    };

    const drawRuler = (thumbY: number, p: number) => {
      const W = RAIL_W;
      ctx.clearRect(0, 0, W, L.vh);
      const H = L.docH;
      const offset = thumbY - p * H;
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      for (let i = 0; i <= 100; i++) {
        const y = offset + (i * H) / 100;
        if (y < -12 || y > L.vh + 12) continue;
        const major = i % 5 === 0;
        const near = Math.exp(-(((y - thumbY) / 70) ** 2));
        const hov = hoverY >= 0 ? Math.exp(-(((y - hoverY) / 55) ** 2)) : 0;
        const g = Math.max(near, hov);
        const len = (major ? 20 : 10) + 20 * g;
        const alpha = clamp((major ? 0.55 : 0.28) + 0.45 * g);
        ctx.fillStyle = `rgba(190,225,255,${alpha})`;
        ctx.fillRect(W - len, Math.round(y), len, 1);
        if (major && Math.abs(y - thumbY) > 20) {
          ctx.fillStyle = `rgba(190,225,255,${0.35 + 0.4 * g})`;
          ctx.fillText(String(i), W - 26 - 14 * g, y);
        }
      }
      // thumb
      ctx.fillStyle = "#5eead4";
      ctx.shadowColor = "rgba(94,234,212,.8)";
      ctx.shadowBlur = 10;
      ctx.fillRect(0, thumbY - 1.5, W, 3);
      ctx.shadowBlur = 0;
      ctx.textAlign = "right";
      ctx.fillText(`${String(Math.round(p * 100)).padStart(3, "0")}%`, W - 6, thumbY + 14);
    };

    const placeLetters = () => {
      const n = SECTIONS.length;
      const right = L.vw - RAIL_W;
      const botY = L.vh - 96;
      for (let i = 0; i < n; i++) {
        const els = letters.current[i];
        const d = i - fs;
        const count = els.length;
        const total = L.totals[i];
        let cum = 0;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, vis = 0;

        for (let l = 0; l < count; l++) {
          const w = L.widths[i][l];
          const k = count > 1 ? l / (count - 1) : 0;
          // Position/scale follow the title as a whole (d); only the swing is staggered per letter (u).
          const u = d >= 0 ? d * (1 + 0.25 * k) : d * (1 + 0.25 * (1 - k));
          let s: number, cx: number, cy: number, theta: number, op: number;

          if (d <= 0) {
            const t = clamp(-d);
            s = lerp(1, 0.42, easeOut(t));
            cy = TOP_Y - 42 * -d;
            theta = 0;
            cx = right - (total * s) / 2;
            op = t < 1 ? 1 - 0.3 * t : 0.7 * (1 - clamp(-d - 1));
          } else {
            const rot = easeInOut(clamp(u / 0.55));
            theta = -90 * rot;
            s = lerp(1, 0.45, easeInOut(clamp(d / 0.55)));
            cy = lerp(TOP_Y, botY, easeInOut(clamp(d))) + Math.max(0, d - 1) * 90;
            cx = lerp(right - (total * s) / 2, L.vw - 34, rot);
            op = lerp(1, 0.5, clamp(d)) * (1 - clamp((d - 1.05) / 0.6));
          }

          const o = (cum + (w - FONT_PX * SPACING) / 2 - total / 2) * s;
          const rad = (theta * Math.PI) / 180;
          const x = cx + o * Math.cos(rad);
          const y = cy + o * Math.sin(rad);
          cum += w;

          const el = els[l];
          el.style.opacity = op.toFixed(3);
          el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${theta.toFixed(2)}deg) scale(${s.toFixed(3)})`;
          if (op > 0.2) {
            const r = FONT_PX * s * 0.6;
            minX = Math.min(minX, x - r);
            maxX = Math.max(maxX, x + r);
            minY = Math.min(minY, y - r);
            maxY = Math.max(maxY, y + r);
            vis++;
          }
        }

        const a = links.current[i];
        if (a) {
          const show = vis > 0 && Math.abs(d) <= 1.05;
          a.style.pointerEvents = show ? "auto" : "none";
          if (show) {
            a.style.left = minX + "px";
            a.style.top = minY + "px";
            a.style.width = maxX - minX + "px";
            a.style.height = maxY - minY + "px";
          }
        }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const sy = window.scrollY;
      const maxS = Math.max(1, L.docH - L.vh);
      const p = clamp(sy / maxS);
      const f = sectionFloat(sy, maxS);

      const kf = reduce ? 1 : 1 - Math.exp(-dt * 8);
      const kp = reduce ? 1 : 1 - Math.exp(-dt * 16);
      const nf = fs + (f - fs) * kf;
      const np = ps + (p - ps) * kp;
      const moving = Math.abs(f - nf) > 0.0004 || Math.abs(p - np) > 0.0004;
      fs = Math.abs(f - nf) > 0.0004 ? nf : f;
      ps = Math.abs(p - np) > 0.0004 ? np : p;

      if (!dirty && !moving && sy === lastSy) return;
      lastSy = sy;
      dirty = false;

      const thumbY = PAD_T + ps * (L.vh - PAD_T - PAD_B);
      drawRuler(thumbY, ps);
      placeLetters();
      rail.current?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    };

    // --- rail interaction: click / drag to scrub ---
    const el = rail.current!;
    const scrubTo = (clientY: number) => {
      const p = clamp((clientY - PAD_T) / (L.vh - PAD_T - PAD_B));
      window.scrollTo({ top: p * (L.docH - L.vh), behavior: "instant" as ScrollBehavior });
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      scrubTo(e.clientY);
    };
    const move = (e: PointerEvent) => {
      hoverY = e.clientY;
      dirty = true;
      if (dragging) scrubTo(e.clientY);
    };
    const up = () => (dragging = false);
    const leave = () => {
      hoverY = -1;
      dirty = true;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);

    const key = (e: KeyboardEvent) => {
      const step = e.key === "ArrowDown" ? 120 : e.key === "ArrowUp" ? -120 : 0;
      if (step) {
        e.preventDefault();
        window.scrollBy({ top: step, behavior: "instant" as ScrollBehavior });
      }
    };
    el.addEventListener("keydown", key);

    measure();
    fs = sectionFloat(window.scrollY, Math.max(1, L.docH - L.vh));
    ps = clamp(window.scrollY / Math.max(1, L.docH - L.vh));
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    document.fonts?.ready.then(measure);
    window.addEventListener("load", measure);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div className="rail-root">
      <div className="rail-fade rail-fade-side" aria-hidden />
      <div className="rail-fade rail-fade-top" aria-hidden />
      <div className="rail-fade rail-fade-bottom" aria-hidden />

      <div
        ref={rail}
        className="rail"
        role="scrollbar"
        aria-controls="main"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-label="Page position"
        tabIndex={0}
        data-hover
      >
        <canvas ref={canvas} />
      </div>

      <div className="rail-titles">
        {SECTIONS.map((s, i) => (
          <span key={s.id} aria-hidden>
            {[...s.label.toUpperCase()].map((ch, l) => (
              <span
                key={l}
                className="rail-letter"
                ref={(el) => {
                  if (el) letters.current[i][l] = el;
                }}
              >
                {ch}
              </span>
            ))}
          </span>
        ))}
        {SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={`Jump to ${s.label}`}
            className="rail-link"
            ref={(el) => {
              if (el) links.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}
