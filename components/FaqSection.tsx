'use client';

import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FaqSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true
  });
  const [openItem, setOpenItem] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is Inzikt and how does it work?",
      answer: "Inzikt is an AI-driven platform that automatically fetches and analyzes your support tickets, categorizes them, and delivers insights, trends, and recommendations in seconds. Simply connect your ticket system (Zendesk, Freshdesk, etc.), and Inzikt does the rest."
    },
    {
      question: "Which systems can I integrate with?",
      answer: "All plans include integration with Zendesk and Freshdesk. Pro and Enterprise plans also include Intercom, Jira, and Zapier, plus the ability to build custom integrations via our API."
    },
    {
      question: "Is my customer data secure?",
      answer: "Yes—all traffic is encrypted with TLS/SSL and we comply with GDPR."
    },
    {
      question: "Do I need technical knowledge to get started?",
      answer: "No—Inzikt is designed for all skill levels. You only need your API key or login credentials for your ticket system, and we handle the rest."
    },
    {
      question: "How much does it cost to analyze tickets beyond my plan's allowance?",
      answer: "Over-quota rates per ticket are: Starter: $0.20, Growth: $0.15, Pro: $0.10, Enterprise: Unlimited at no extra charge"
    },
    {
      question: "Do you offer a free trial?",
      answer: "No, we do not offer a free trial. We believe in transparent pricing—choose a plan and cancel anytime with no hidden fees."
    },
    {
      question: "How often are my analyses updated?",
      answer: "Update frequency by plan: Starter: Weekly, Growth: Daily, Pro: Hourly, Enterprise: Nearly real-time"
    },
    {
      question: "Can I export insights and reports?",
      answer: "Yes, all insights can be downloaded as CSV or PDF directly from the dashboard. You can also schedule automatic email reports."
    },
    {
      question: "What support can I expect if I need help?",
      answer: "Starter & Growth: Email support with a 24-hour response time, Pro: Priority email support with a 4-hour response time, Enterprise: Dedicated Customer Success Manager and agreed SLA response time"
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-white to-orange-50">
      <div className="container mx-auto px-4 md:px-6">
        <div 
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about Inzikt
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white transition-all duration-500 ${
                isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ 
                transitionDelay: `${Math.min(index * 100, 300)}ms`,
                transitionDuration: "500ms",
                transitionTimingFunction: "ease-out"
              }}
            >
              <button
                onClick={() => toggleItem(index)}
                className="flex justify-between items-center w-full p-6 text-left focus:outline-none"
              >
                <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                {openItem === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openItem === index ? "max-h-96 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 