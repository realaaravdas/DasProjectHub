import { motion } from "framer-motion";
import { config } from "../config";
import ProjectCard from "./ProjectCard";

export default function Projects() {
  return (
    <section id="projects" className="section">
      <motion.div className="section-head" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <p className="eyebrow">01 — Projects</p>
        <h2>Everything I'm building,<br />one click away.</h2>
      </motion.div>
      <div className="grid">
        {config.apps.map((a, i) => <ProjectCard key={a.slug} app={a} index={i} />)}
        <motion.a
          className="card card-add"
          href={config.site.github}
          target="_blank"
          rel="noreferrer"
          data-hover
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="plus">+</span>
          <p>More on the way</p>
        </motion.a>
      </div>
    </section>
  );
}
