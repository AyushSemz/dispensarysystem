"use client";

import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import TextPressure from "@/components/ui/TextPressure";
import VariableProximity from "@/components/ui/VariableProximity";
import Particles from "@/components/ui/Particles";
import { useRef } from "react";

export function HeroSection2() {
  const containerRef = useRef(null);
  return (
    <section
      className="bg-black section-padding-y"
      aria-labelledby="hero-heading"
    >
      <div className="container-padding-x container mx-auto flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Left Column */}
        <div className="flex flex-1 flex-col gap-6 lg:gap-8">
          {/* Section Title */}
          <div className="section-title-gap-xl flex flex-col">
            {/* Tagline */}
            <Tagline>PEC Dispensary</Tagline>
            {/* Main Heading */}
            <div className="heading-xl" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ position: 'relative', height: '60px', wordSpacing: 'normal', letterSpacing: 'normal' }}>
                <TextPressure
                  text="Digitize and streamline"
                  flex={false}
                  alpha={false}
                  stroke={false}
                  width={true}
                  weight={true}
                  italic={true}
                  minFontSize={32}
                  textColor="#FFFFFF"
                  fontFamily="inherit"
                  fontUrl=""
                />
              </div>
              <div style={{ position: 'relative', height: '60px', wordSpacing: 'normal', letterSpacing: 'normal' }}>
                <TextPressure
                  text="every patient interaction"
                  flex={false}
                  alpha={false}
                  stroke={false}
                  width={true}
                  weight={true}
                  italic={true}
                  minFontSize={32}
                  textColor="#FFFFFF"
                  fontFamily="inherit"
                  fontUrl=""
                />
              </div>
            </div>
            {/* Description */}
            <div ref={containerRef} style={{ position: 'relative' }}>
              <VariableProximity
                label="A full-stack healthcare management system that manages appointments, prescriptions, and transforms feedback into actionable insights using NLP."
                className="text-gray-300 text-base lg:text-lg"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={100}
                falloff="linear"
              />
            </div>
          </div>

          {/* Feature List */}
          <div className="flex flex-col gap-2 md:gap-3">
            <div className="flex items-start gap-3">
              <div className="pt-0.5 flex-shrink-0">
                <Check className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <VariableProximity
                  label="Efficient patient visit and prescription tracking"
                  className="text-white text-base leading-6 font-medium"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={containerRef}
                  radius={100}
                  falloff="linear"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="pt-0.5 flex-shrink-0">
                <Check className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <VariableProximity
                  label="Patient feedback and sentiment analysis"
                  className="text-white text-base leading-6 font-medium"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={containerRef}
                  radius={100}
                  falloff="linear"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="pt-0.5 flex-shrink-0">
                <Check className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <VariableProximity
                  label="Disease outbreak identification and alerts"
                  className="text-white text-base leading-6 font-medium"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={containerRef}
                  radius={100}
                  falloff="linear"
                />
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>Login</Button>
            <Button variant="outline">
              How it works
              <ArrowRight />
            </Button>
          </div>
        </div>

        {/* Right Column - Full Width */}
        <div className="w-full flex-1">
          <div className="relative h-[300px] lg:h-[400px] rounded-xl overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-contain"
            >
              <source src="/hero-1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
