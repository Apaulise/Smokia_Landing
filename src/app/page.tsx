import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Stage from "@/components/Stage";
import HowWeWork from "@/components/HowWeWork";
import Projects from "@/components/Projects";
import Methodology from "@/components/Methodology";
import Results from "@/components/Results";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ParticleField from "@/components/ParticleField3D";
import CinematicStage from "@/components/CinematicStage";
import RevealProvider from "@/components/RevealProvider";
import Tilt3D from "@/components/Tilt3D";
import ScrollProgress from "@/components/ScrollProgress";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function Page() {
  return (
    <>
      {/* El campo de partículas es el escenario: vive detrás de toda la página
          y cambia de forma con el scroll (ondas → dispersión → grilla →
          embudo → barras → convergencia). */}
      <CinematicStage />
      <ParticleField atmosphere={false} />
      <ScrollProgress />

      <div className="page">
        <Nav />
        <main>
          <Hero />
          <Stage />
          <HowWeWork />
          <Projects />
          <Methodology />
          <Results />
          <Faq />
          <FinalCta />
          <Contact />
        </main>
        <Footer />
      </div>

      <RevealProvider />
      <Tilt3D />
      <WhatsAppFloat />
    </>
  );
}
