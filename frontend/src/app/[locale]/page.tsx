import Header from "@/components/marketing/Header";
import Hero from "@/components/marketing/Hero";
import Features from "@/components/marketing/Features";
import HowItWorks from "@/components/marketing/HowItWorks";
import CTA from "@/components/marketing/CTA";
import Footer from "@/components/marketing/Footer";

export default function Landing() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
