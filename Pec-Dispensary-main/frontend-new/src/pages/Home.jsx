import React from 'react';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";
import { HeroSection2 } from "@/components/pro-blocks/landing-page/hero-sections/hero-section-2";
import TestimonialsSection1 from "@/components/pro-blocks/landing-page/testimonials-sections/testimonials-section-1";
import { BentoGrid6 } from "@/components/pro-blocks/landing-page/bento-grids/bento-grid-6";
import { FeatureSection9 } from "@/components/pro-blocks/landing-page/feature-sections/feature-section-9";
import { StatsSection4 } from "@/components/pro-blocks/landing-page/stats-sections/stats-section-4";
import { FaqSection2 } from "@/components/pro-blocks/landing-page/faq-sections/faq-section-2";
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1";
import ClickSpark from "@/components/ui/ClickSpark";

export default function Home() {
  return (
    <ClickSpark
      sparkColor='#3b82f6'
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <main className="bg-black min-h-screen">
        <LpNavbar1 />
        <HeroSection2 />
        <BentoGrid6 />
        <FeatureSection9 />
        <StatsSection4 />
        <FaqSection2 />
        <Footer1 />
      </main>
    </ClickSpark>
  );
}
