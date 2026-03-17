"use client";

import { LogIn, ClipboardList, Brain, Bell } from "lucide-react";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import Galaxy from "@/components/ui/Galaxy";

export function FeatureSection9() {
  return (
    <section
      className="bg-black section-padding-y border-b border-gray-800 relative overflow-hidden"
      id="how-it-works"
    >
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
      <div className="container-padding-x container mx-auto flex flex-col gap-10 md:gap-12 relative z-10">
        <div className="section-title-gap-lg mx-auto flex max-w-xl flex-col items-center text-center">
          <Tagline>How it works</Tagline>
          <h2 className="heading-lg text-white">
            Our system digitizes the entire dispensary workflow
          </h2>
          <p className="text-gray-400 text-base">
            From booking appointments to analyzing feedback with NLP, turning patient comments into actionable health insights and alerts.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <div className="flex flex-col items-center justify-start gap-5 text-center">
            <div className="bg-gray-900 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-700">
              <LogIn className="text-blue-400 h-5 w-5 mx-auto" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-semibold">1. Log In & Book</h3>
              <p className="text-gray-400">
                Patients and doctors securely log in to the web platform to manage profiles and schedule appointments
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-start gap-5 text-center">
            <div className="bg-gray-900 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-700">
              <ClipboardList className="text-blue-400 h-5 w-5 mx-auto" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-semibold">2. Manage & Feedback</h3>
              <p className="text-gray-400">
                Doctors create digital visit records and prescriptions, while patients submit feedback on their experience
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-start gap-5 text-center">
            <div className="bg-gray-900 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-700">
              <Brain className="text-blue-400 h-5 w-5 mx-auto" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-semibold">3. Analyze</h3>
              <p className="text-gray-400">
                Our NLP and NN models instantly analyze patient feedback for sentiment and doctor remarks for key health patterns
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-start gap-5 text-center">
            <div className="bg-gray-900 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-700">
              <Bell className="text-blue-400 h-5 w-5 mx-auto" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-semibold">4. Alert & Improve</h3>
              <p className="text-gray-400">
                The system generates real-time health alerts for disease outbreaks and provides valuable insights to help improve dispensary services
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
