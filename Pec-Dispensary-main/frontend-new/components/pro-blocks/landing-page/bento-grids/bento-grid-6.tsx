"use client";

import { Card as UICard, CardContent } from "@/components/ui/card";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import CardSwap, { Card } from "@/components/ui/CardSwap";

export function BentoGrid6() {
  return (
    <section className="bg-black section-padding-y border-b border-gray-800 border-t border-gray-800" id="features">
      <div className="container-padding-x container mx-auto flex flex-col gap-10 md:gap-12">
        {/* Section Layout with Title on Left and Cards on Right */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
          {/* Left Side - Section Title */}
          <div className="section-title-gap-lg flex max-w-xl flex-col lg:flex-1">
            {/* Tagline */}
            <Tagline>Features</Tagline>
            {/* Main Heading */}
            <h2 className="heading-lg text-white">
              Streamline, organize, and analyze dispensary operations
            </h2>
            {/* Description */}
            <p className="text-gray-400 mt-4 text-base leading-relaxed">
              Our system leverages BERT-based NLP models to analyze patient feedback and doctor remarks in real-time. By identifying recurring symptom keywords and sentiment patterns, the model automatically triggers health alerts when symptom counts exceed predefined thresholds, enabling early detection of potential disease outbreaks and actionable insights for improved patient care.
            </p>
          </div>

          {/* Right Side - Feature Cards with CardSwap */}
          <div className="lg:flex-1" style={{ height: '330px', position: 'relative' }}>
            <CardSwap
              width={320}
              height={300}
              cardDistance={50}
              verticalDistance={60}
              delay={1500}
              pauseOnHover={true}
              scrollEnabled={false}
            >
            <Card>
              <div className="p-5 h-full flex flex-col gap-3">
                <div className="flex-shrink-0">
                  <img
                    src="/ai-meeting-notes.png"
                    alt="AI Feedback Analysis"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-white text-lg font-semibold">
                  AI Feedback Analysis
                </h3>
                <p className="text-gray-400 text-sm">
                  Automatic sentiment analysis of patient feedback to identify key concerns and improve service quality
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-5 h-full flex flex-col gap-3">
                <div className="flex-shrink-0">
                  <img
                    src="/universal-search.png"
                    alt="Comprehensive Patient Search"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-white text-lg font-semibold">
                  Comprehensive Patient Search
                </h3>
                <p className="text-gray-400 text-sm">
                  Instantly find patient visit history, prescriptions, and feedback with our powerful search
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-5 h-full flex flex-col gap-3">
                <div className="flex-shrink-0">
                  <img
                    src="/smart-tags.png"
                    alt="Smart Categorization"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-white text-lg font-semibold">
                  Smart Categorization
                </h3>
                <p className="text-gray-400 text-sm">
                  Automatically tag feedback by topic, department, or urgency for efficient management
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-5 h-full flex flex-col gap-3">
                <div className="flex-shrink-0">
                  <img
                    src="/team-insights.png"
                    alt="Health & Operational Insights"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-white text-lg font-semibold">
                  Health & Operational Insights
                </h3>
                <p className="text-gray-400 text-sm">
                  Disease outbreak identification, alert generation, and dispensary efficiency metrics
                </p>
              </div>
            </Card>
          </CardSwap>
        </div>
        </div>
      </div>
    </section>
  );
}
