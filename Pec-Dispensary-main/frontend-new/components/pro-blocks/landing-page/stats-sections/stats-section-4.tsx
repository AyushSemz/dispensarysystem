"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import Galaxy from "@/components/ui/Galaxy";

export function StatsSection4() {
  return (
    <section className="bg-black section-padding-y border-b border-gray-800 relative overflow-hidden">
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <Galaxy 
          mouseRepulsion={true}
          mouseInteraction={true}
          density={0.4}
          glowIntensity={0.08}
          saturation={0.0}
          hueShift={0}
          transparent={true}
          twinkleIntensity={0.1}
        />
      </div>
      <div className="container-padding-x container mx-auto relative z-10">
        <div className="flex flex-col gap-10 md:gap-12">
          <div className="section-title-gap-lg mx-auto flex max-w-xl flex-col items-center text-center">
            <Tagline>Metrics</Tagline>
            <h2 className="heading-lg text-white">Data-driven insights for a healthier campus</h2>
            <p className="text-gray-400">
              Our system transforms raw feedback and visit data into measurable improvements in dispensary efficiency and student well-being.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row">
            <Card className="bg-black/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 shadow-none">
              <CardContent className="flex flex-col gap-2 p-0 md:gap-3 items-center text-center">
                <h3 className="text-blue-400 font-semibold">
                  Feedbacks & Remarks Analyzed
                </h3>
                <span className="text-white text-3xl font-semibold md:text-4xl">
                  1000+
                </span>

                <p className="text-gray-400 text-base">
                  Our NLP models process patient feedback and doctor remarks to identify sentiment, service quality metrics, and emerging health trends.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 shadow-none">
              <CardContent className="flex flex-col gap-2 p-0 md:gap-3 items-center text-center">
                <h3 className="text-blue-400 font-semibold">
                  Health Alerts Generated
                </h3>
                <span className="text-white text-3xl font-semibold md:text-4xl">
                  10+
                </span>
                <p className="text-gray-400 text-base">
                  Automated alerts for recurring symptoms like 'fever' and 'cough' help notify the community and administration of potential outbreaks.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 shadow-none">
              <CardContent className="flex flex-col gap-2 p-0 md:gap-3 items-center text-center">
                <h3 className="text-blue-400 font-semibold">
                  Sentiment Model MAE
                </h3>
                <span className="text-white text-3xl font-semibold md:text-4xl">
                  0.7687
                </span>
                <p className="text-gray-400 text-base">
                  Our RNN model predicts user satisfaction with a Mean Absolute Error of just 0.7687, ensuring high accuracy in understanding patient sentiment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
