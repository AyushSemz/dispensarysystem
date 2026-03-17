"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";

export function FaqSection2() {
  return (
    <section
      className="bg-blue-950 section-padding-y border-b"
      aria-labelledby="faq-heading"
      id="faq"
    >
      <div className="container-padding-x container mx-auto">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Left Column */}
          <div className="section-title-gap-lg flex flex-1 flex-col">
            {/* Category Tag */}
            <Tagline>FAQ</Tagline>
            {/* Main Title */}
            <h1 id="faq-heading" className="heading-lg text-white">
              Find answers to our frequently asked questions
            </h1>
            {/* Section Description */}
            <p className="text-gray-400">
              We&apos;ve compiled the most important information to help you get
              the most out of your experience. Can&apos;t find what you&apos;re
              looking for?{" "}
              <a href="#" className="text-blue-400 underline">
                Contact us.
              </a>
            </p>
          </div>

          {/* Right Column */}
          <div className="flex flex-1 flex-col gap-8">
            {/* General FAQ Section */}
            <div className="flex flex-col gap-2">
              {/* Section Title */}
              <h2 className="text-white text-lg font-semibold md:text-xl">
                General
              </h2>
              {/* FAQ Accordion */}
              <Accordion
                type="single"
                collapsible
                aria-label="General FAQ items"
              >
                {/* FAQ Item 1 */}
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left text-gray-200">
                    How does PEC Dispensary manage appointments?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    PEC Dispensary provides a comprehensive appointment scheduling
                    system that allows patients to book appointments online. Healthcare
                    providers can view, manage, and update appointments in real-time.
                    The system sends automatic reminders to patients and maintains
                    a complete history of all visits and prescriptions.
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ Item 2 */}
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left text-gray-200">
                    How does the NLP feedback analysis work?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    PEC Dispensary uses Natural Language Processing (NLP) and Neural
                    Networks (NN) to analyze patient feedback in real-time. The system
                    can identify sentiment patterns, detect potential disease outbreaks,
                    and generate actionable insights from patient comments. This helps
                    healthcare providers respond quickly to emerging health concerns
                    and improve overall patient care quality.
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ Item 3 */}
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left text-gray-200">
                    How does the system know when to generate a disease outbreak alert?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    The system uses Natural Language Processing (NLP) to analyze both doctor remarks and patient feedback. It automatically identifies and counts keywords for recurring symptoms like "fever," "cough," and "cold". When the count for these symptoms exceeds a set threshold within a specific timeframe, the system automatically triggers a health alert. These alerts are then displayed on the frontend dashboard for all users to see.
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ Item 4 */}
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left text-gray-200">
                    How accurate is the machine learning model for patient feedback analysis?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    The system uses a Recurrent Neural Network (RNN) model to analyze patient feedback and determine overall user satisfaction through sentiment analysis. The model&apos;s accuracy is measured by its Mean Absolute Error (MAE), which is 0.7687. This means, on average, the model&apos;s predicted rating is very close to the actual rating the user gave.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
