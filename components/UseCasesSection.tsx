'use client';

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { 
  LineChart, MessageCircle, Lightbulb, AlertTriangle,
  ArrowUpRight, TrendingUp
} from "lucide-react";

export function UseCasesSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true
  });

  const useCases = [
    {
      icon: <LineChart className="h-8 w-8 text-orange-500" />,
      title: "Product Development",
      description: "Identify feature requests and prioritize roadmap based on customer feedback"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-pink-500" />,
      title: "Customer Support",
      description: "Reduce resolution time by identifying common issues and solutions"
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-orange-500" />,
      title: "User Experience",
      description: "Discover pain points and friction in your product experience"
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-pink-500" />,
      title: "Issue Detection",
      description: "Catch emerging problems before they affect multiple customers"
    },
    {
      icon: <ArrowUpRight className="h-8 w-8 text-orange-500" />,
      title: "Growth Strategy",
      description: "Understand what drives retention and expansion opportunities"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-pink-500" />,
      title: "Executive Insights",
      description: "Get high-level views of customer sentiment and product health"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div 
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Use Cases</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            How teams across your organization can benefit from Inzikt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300 transform hover:scale-105 ${
                isIntersecting 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-5"
              }`}
              style={{ 
                transitionDelay: `${Math.min(index * 100, 400)}ms`,
                transitionDuration: "600ms",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-full">
                  {useCase.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{useCase.title}</h3>
                  <p className="text-gray-600">{useCase.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 