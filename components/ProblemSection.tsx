'use client';

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function ProblemSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  const problems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      title: "Overwhelmed by tickets",
      description: "Too many tickets, not enough insights",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      title: "Manual analysis",
      description: "Hours spent studying ticket trends",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
      title: "Missed opportunities",
      description: "Valuable feedback gets lost in noise",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: "Slow response times",
      description: "Delays in addressing critical issues",
    },
  ];

  return (
    <section 
      id="problem" 
      ref={ref} 
      className="py-16 px-4 bg-white"
    >
      <div className={`max-w-6xl mx-auto ${isIntersecting ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
        <h2 className="text-3xl font-bold text-center text-[#0E0E10] mb-12">
          The Problem
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4">
                {problem.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#0E0E10] mb-2">
                {problem.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 