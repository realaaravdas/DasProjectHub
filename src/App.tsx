import Background from "./components/Background";
import Cursor from "./components/Cursor";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Approach from "./components/Approach";
import Footer from "./components/Footer";
import { usePointerTracking } from "./hooks/usePointer";

export default function App() {
  usePointerTracking();
  return (
    <>
      <Background />
      <div className="spotlight" aria-hidden />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Approach />
      </main>
      <Footer />
    </>
  );
}
