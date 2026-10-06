import { useEffect, useRef } from "react";

/** Shared, smoothed pointer position (normalised 0..1) without re-rendering React. */
export const pointer = { x: 0.5, y: 0.5, px: 0, py: 0, active: false };

export function usePointerTracking() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.px = e.clientX;
      pointer.py = e.clientY;
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
      pointer.active = true;
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    const leave = () => (pointer.active = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
}

export function useReducedMotion(): boolean {
  const ref = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return ref.current;
}
