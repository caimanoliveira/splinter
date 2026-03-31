import { Navbar } from "./_components/Navbar";
import { Hero } from "./_components/Hero";
import { ForWho } from "./_components/ForWho";
import { Problem } from "./_components/Problem";
import { DecisionCanvas } from "./_components/DecisionCanvas";
import { Pricing } from "./_components/Pricing";
import { Mentor } from "./_components/Mentor";
import { Qualification } from "./_components/Qualification";
import { Testimonials } from "./_components/Testimonials";
import { Process } from "./_components/Process";
import { FAQ } from "./_components/FAQ";
import { Footer } from "./_components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ForWho />
        <Problem />
        <DecisionCanvas />
        <Pricing />
        <Mentor />
        <Qualification />
        <Testimonials />
        <Process />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
