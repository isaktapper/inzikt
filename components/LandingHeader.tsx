'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-white w-full transition-all duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/inzikt_logo.svg" alt="Inzikt" className="h-8 w-auto" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="#solution" 
            className="text-sm font-medium text-[#0E0E10] hover:text-orange-400 transition-colors"
          >
            Solution
          </Link>
          <Link 
            href="#faq" 
            className="text-sm font-medium text-[#0E0E10] hover:text-orange-400 transition-colors"
            onClick={(e) => {
              // Handle smooth scrolling to FAQ section
              e.preventDefault();
              const faqSection = document.getElementById('faq');
              if (faqSection) {
                faqSection.scrollIntoView({ behavior: 'smooth' });
              } else if (window.location.pathname !== '/') {
                window.location.href = '/#faq';
              }
            }}
          >
            FAQ
          </Link>
          <Link 
            href="/pricing" 
            className="text-sm font-medium text-[#0E0E10] hover:text-orange-400 transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium text-[#0E0E10] hover:text-orange-400 transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-medium text-white px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 hover:shadow-lg hover:scale-105 transition-all"
          >
            Get Started
          </Link>
        </nav>
        
        <button className="md:hidden text-[#0E0E10]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </header>
  );
} 