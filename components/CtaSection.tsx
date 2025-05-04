'use client';

import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function CtaSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true
  });

  return (
    <section 
      ref={ref} 
      className="py-16 px-4 text-center"
    >
      <div className={`max-w-4xl mx-auto ${isIntersecting ? 'animate-fade-in' : 'opacity-0'}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-[#0E0E10] mb-6">
          Start turning tickets into insights today
        </h2>
        
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join hundreds of support teams that use Inzikt to improve their products and customer experience.
        </p>
        
        <Link 
          href="/register" 
          className="inline-block bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-4 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          Get Started Free
        </Link>
      </div>
    </section>
  );
} 