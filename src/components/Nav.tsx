import { motion, useScroll, useSpring } from "framer-motion";
import { config } from "../config";

export default function Nav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <header className="nav">
      <a href="#top" className="brand" aria-label="Home">
        <span className="brand-mark" />
        <span>{config.site.name}</span>
      </a>
      <nav>
        <a href="#projects">Projects</a>
        <a href="#approach">Approach</a>
        <a href="#contact">Contact</a>
        <a href={config.site.github} target="_blank" rel="noreferrer" className="nav-cta">
          GitHub ↗
        </a>
      </nav>
      <motion.div className="progress" style={{ scaleX }} />
    </header>
  );
}
