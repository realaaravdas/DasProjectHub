import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { config } from "../config";
import Magnetic from "./Magnetic";

const words = ["Projects", "built", "to", "run", "quietly,", "reliably."];

export default function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 140]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 });
  const orbX = useTransform(mx, (v) => v * 40);
  const orbY = useTransform(my, (v) => v * 40);

  return (
    <section
      id="top"
      className="hero"
      onPointerMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      <motion.div className="orb orb-a" style={{ x: orbX, y: orbY }} />
      <motion.div className="orb orb-b" style={{ x: useTransform(orbX, (v) => -v * 1.5), y: useTransform(orbY, (v) => -v * 1.5) }} />
      <motion.div className="hero-inner" style={{ y, opacity }}>
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="pulse" /> {config.site.name} / Project Hub
        </motion.p>
        <h1>
          {words.map((w, i) => (
            <span className="word-mask" key={i}>
              <motion.span
                className={i >= 4 ? "grad" : undefined}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.25 + i * 0.07, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {w}&nbsp;
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="lede" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}>
          {config.site.tagline} A growing collection of my personal TypeScript applications, each running live on its own
          route of one server.
        </motion.p>
        <motion.div className="cta-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.8 }}>
          <Magnetic>
            <a href="#projects" className="btn primary">Explore projects</a>
          </Magnetic>
          <Magnetic>
            <a href={config.site.github} target="_blank" rel="noreferrer" className="btn ghost">View on GitHub ↗</a>
          </Magnetic>
        </motion.div>
      </motion.div>
      <div className="scroll-hint" aria-hidden>
        <span />
      </div>
    </section>
  );
}
