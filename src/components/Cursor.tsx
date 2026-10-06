import { useEffect, useRef } from "react";
import { pointer } from "../hooks/usePointer";

/** Soft ring + dot that trails the cursor and grows over interactive elements. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    let x = pointer.px,
      y = pointer.py,
      raf = 0;
    const frame = () => {
      x += (pointer.px - x) * 0.16;
      y += (pointer.py - y) * 0.16;
      if (ring.current) ring.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (dot.current) dot.current.style.transform = `translate3d(${pointer.px}px,${pointer.py}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const over = (e: Event) => {
      const t = (e.target as HTMLElement).closest("a,button,[data-hover]");
      ring.current?.classList.toggle("is-hot", !!t);
    };
    document.addEventListener("pointerover", over);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerover", over);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
