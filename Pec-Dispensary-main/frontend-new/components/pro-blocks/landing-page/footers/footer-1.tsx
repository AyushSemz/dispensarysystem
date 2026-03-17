"use client";

import { Logo } from "@/components/pro-blocks/logo";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export function Footer1() {
  return (
    <footer
      className="bg-blue-950 section-padding-y"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container-padding-x container mx-auto flex flex-col gap-12 lg:gap-16">
        {/* Top Section */}
        <div className="flex w-full flex-col items-center gap-12 text-center">
          {/* Logo Section */}
          <Link to="/" aria-label="Go to homepage">
            <Logo />
          </Link>

          {/* Main Navigation */}
          <nav
            className="flex flex-col items-center gap-6 text-sm md:flex-row md:gap-8"
            aria-label="Footer navigation"
          >
            <a
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-400 hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="text-gray-400 hover:text-white transition-colors"
            >
              FAQ
            </a>
          </nav>
        </div>

        {/* Section Divider */}
        <Separator role="presentation" />

        {/* Bottom Section */}
        <div className="flex w-full flex-col items-center gap-6 text-sm">
          {/* Copyright Text */}
          <p className="text-gray-400 text-center">
            © 2025 PEC Dispensary. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
