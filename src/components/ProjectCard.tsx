import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { appUrl } from "../config";
import type { HubApp } from "../types";

const label = { live: "Live", beta: "Beta", planned: "Coming soon" } as const;

export default function ProjectCard({ app, index }: { app: HubApp; index: number }) {
  const el = useRef<HTMLAnchorElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const bg = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(420px circle at ${x}% ${y}%, rgba(94,234,212,.16), transparent 60%)`);

  const external = app.status === "planned";
  return (
    <motion.a
      ref={el}
      href={appUrl(app)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="card"
      data-hover
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={(e) => {
        const r = el.current!.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * 10);
        rx.set(-(py - 0.5) * 10);
        glowX.set(px * 100);
        glowY.set(py * 100);
      }}
      onPointerLeave={() => (rx.set(0), ry.set(0))}
    >
      <motion.span className="card-glow" style={{ background: bg }} />
      <div className="card-top">
        <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
        <span className={`badge ${app.status}`}>{label[app.status]}</span>
      </div>
      <h3>{app.name}</h3>
      <p>{app.description}</p>
      <div className="card-bottom">
        <ul>{app.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        <span className="arrow">↗</span>
      </div>
    </motion.a>
  );
}
