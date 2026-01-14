// src/app/[locale]/page.tsx
import Header from "@/components/marketing/header";
import Hero from "@/components/marketing/hero";
import Compliance from "@/components/marketing/compliance";
import Features from "@/components/marketing/features";
import HowItWorks from "@/components/marketing/howitworks";
import Pricing from "@/components/marketing/pricing";
import CTA from "@/components/marketing/cta";
import Footer from "@/components/marketing/Footer";

export default function LocaleHomePage() {
  return (
    <div className="min-h-screen noise">
      <Header />
      <main>
        <Hero />
        <Compliance />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
