"use client";

import { Tagline } from "@/components/pro-blocks/landing-page/tagline";

const logosData = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 8 },
];

export function LogoSection10() {
  return (
    <section className="bg-blue-950 border-b pb-16 lg:pb-24">
      <div className="container-padding-x container mx-auto">
        <div className="flex flex-col items-center gap-8 md:gap-12">
          <div className="section-title-gap-lg flex max-w-xl flex-col items-center text-center">
            <Tagline variant="ghost" className="text-white">Trusted by</Tagline>
          </div>

          <div className="relative w-full overflow-hidden mask-[linear-gradient(to_right,transparent_0%,black_12.5%,black_87.5%,transparent_100%)]">
            <div className="animate-infinite-scroll flex w-max items-center">
              {[...logosData, ...logosData].map((logoItem, index) => {
                const uniqueKey = `logo-wrapper-${logoItem.id}-${index}`;
                return (
                  <div
                    key={uniqueKey}
                    className="w-40 flex-shrink-0 flex items-center justify-center"
                  >
                    <img 
                      src="/pec-logo.png" 
                      alt="PEC Logo" 
                      width={120} 
                      height={60}
                      className="object-contain"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes infinite-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50%));
          }
        }

        .animate-infinite-scroll {
          animation: infinite-scroll 20s linear infinite;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}
