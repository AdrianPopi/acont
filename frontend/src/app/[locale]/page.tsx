// src/app/[locale]/page.tsx
import Header from "@/components/marketing/Header";
import Hero from "@/components/marketing/Hero";
import Compliance from "@/components/marketing/compliance";
import Features from "@/components/marketing/Features";
import HowItWorks from "@/components/marketing/HowItWorks";
import Pricing from "@/components/marketing/pricing";
import CTA from "@/components/marketing/CTA";
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
