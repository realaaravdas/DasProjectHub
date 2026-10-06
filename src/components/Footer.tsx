import { motion } from "framer-motion";
import { config } from "../config";
import Magnetic from "./Magnetic";

export default function Footer() {
  return (
    <footer id="contact" className="section footer">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <p className="eyebrow">03 — Contact</p>
        <h2 className="big">Let's build<br /><span className="grad">something.</span></h2>
        <Magnetic strength={0.4}>
          <a className="btn primary" href={config.site.github} target="_blank" rel="noreferrer">Find me on GitHub ↗</a>
        </Magnetic>
      </motion.div>
      <div className="legal">
        <span>© {new Date().getFullYear()} {config.site.name}</span>
        <span>Hosted on Ubuntu · Served with Caddy</span>
      </div>
    </footer>
  );
}
