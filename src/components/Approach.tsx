import { motion } from "framer-motion";

const items = [
  ["One home", "Every app lives on the same server, under one domain, behind one reverse proxy."],
  ["TypeScript first", "Typed end to end — from the UI to the services behind it."],
  ["Open source", "All code is on GitHub. Each card links straight to its repository."],
  ["Self-hosted", "Own the stack: simple processes, automatic HTTPS, zero lock-in."],
];
const stack = ["TypeScript", "React", "Node.js", "Vite", "Next.js", "Caddy", "Ubuntu", "pm2", "GitHub"];

export default function Approach() {
  return (
    <section id="approach" className="section">
      <motion.div className="section-head" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <p className="eyebrow">02 — Approach</p>
        <h2>Simple foundations,<br />polished details.</h2>
      </motion.div>
      <div className="principles">
        {items.map(([t, d], i) => (
          <motion.div key={t} className="principle" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.08, duration: 0.7 }}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h4>{t}</h4>
            <p>{d}</p>
          </motion.div>
        ))}
      </div>
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...stack, ...stack, ...stack, ...stack].map((s, i) => <span key={i}>{s}</span>)}
        </div>
      </div>
    </section>
  );
}
