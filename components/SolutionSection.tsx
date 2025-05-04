'use client';

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export function SolutionSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  const solutions = [
    {
      title: "AI Ticket Analysis",
      description: "Automatically extract insights from every ticket",
    },
    {
      title: "Smart Categorization",
      description: "Instantly identify common issues and patterns",
    },
    {
      title: "Trend Identification",
      description: "Spot recurring problems before they escalate",
    },
    {
      title: "Actionable Insights",
      description: "Get clear recommendations to improve your product",
    },
  ];

  return (
    <section 
      id="solution" 
      ref={ref} 
      className="py-16 px-4 bg-gray-50"
    >
      <div className={`max-w-6xl mx-auto ${isIntersecting ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
        <h2 className="text-3xl font-bold text-center text-[#0E0E10] mb-12">
          Solutions
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {solutions.map((solution, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0E0E10] mb-2">
                {solution.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {solution.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 