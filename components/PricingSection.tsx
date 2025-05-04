import Link from 'next/link';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function PricingSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  const [billingPeriod, setBillingPeriod] = useState('yearly');
  const yearlyDiscount = 0.85; // 15% discount

  const getPriceDisplay = (monthlyPrice: number) => {
    if (billingPeriod === 'yearly') {
      const yearlyPrice = monthlyPrice * yearlyDiscount;
      return `$${Math.round(yearlyPrice)}`;
    }
    return `$${monthlyPrice}`;
  };

  const getSavingsText = (monthlyPrice: number) => {
    if (billingPeriod === 'yearly') {
      const savings = monthlyPrice * 12 * (1 - yearlyDiscount);
      return `Save $${Math.round(savings)} a year`;
    }
    return null;
  };

  const getBillingText = () => {
    if (billingPeriod === 'yearly') {
      return '/mo, billed annually';
    }
    return '/month';
  };

  const pricingPlans = [
    {
      name: "Starter",
      price: 59,
      description: "For small teams just getting started with ticket analysis",
      features: [
        "500 tickets per month",
        "Standard AI Capability",
        "Auto-tagging & AI summarization",
        "Zendesk & Freshdesk integration",
        "5 days backlog import"
      ],
      isPopular: false,
      buttonClass: "bg-[#0E0E10] text-white hover:bg-gray-800"
    },
    {
      name: "Growth",
      price: 149,
      description: "For growing teams needing deeper ticket insights",
      features: [
        "2,000 tickets per month",
        "Standard AI Capability",
        "Trends & insights included",
        "Zendesk & Freshdesk integration",
        "15 days backlog import"
      ],
      isPopular: true,
      buttonClass: "bg-gradient-to-r from-orange-400 to-pink-500 text-white"
    },
    {
      name: "Pro",
      price: 299,
      description: "For teams that need advanced AI and in-depth insights",
      features: [
        "10,000 tickets per month",
        "Advanced AI Capability",
        "Recommendations engine included",
        "API access included",
        "30 days backlog import"
      ],
      isPopular: false,
      buttonClass: "bg-[#0E0E10] text-white hover:bg-gray-800"
    },
    {
      name: "Enterprise",
      price: null,
      description: "For businesses with advanced needs and custom requirements",
      features: [
        "Unlimited tickets",
        "Dedicated AI capabilities",
        "All integrations including Jira",
        "90 days backlog import",
        "Dedicated CSM + SLA"
      ],
      isPopular: false,
      buttonClass: "bg-[#0E0E10] text-white hover:bg-gray-800"
    }
  ];

  return (
    <section 
      id="pricing" 
      ref={ref} 
      className="py-16 px-4 bg-white"
    >
      <div className={`max-w-6xl mx-auto ${isIntersecting ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#0E0E10] mb-4">
            Simple, <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">transparent</span> pricing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your team's needs with no hidden fees
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full transition-all duration-200 ${
                  billingPeriod === 'yearly'
                    ? 'bg-white shadow-sm text-[#0E0E10]'
                    : 'text-gray-500'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-white shadow-sm text-[#0E0E10]'
                    : 'text-gray-500'
                }`}
              >
                Monthly
              </button>
            </div>
            <span className="text-green-600 text-sm font-medium">
              Save 15% with yearly plan
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name} 
              className={`rounded-xl border p-6 flex flex-col h-full relative ${
                plan.isPopular ? 'border-orange-300 shadow-md' : 'border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              
              <h3 className="text-xl font-bold text-[#0E0E10] mb-2">{plan.name}</h3>
              
              <div className="flex items-center gap-1 mb-1">
                <span className="text-3xl font-bold text-[#0E0E10]">
                  {plan.price ? getPriceDisplay(plan.price) : 'Custom Pricing'}
                </span>
                {plan.price && (
                  <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                )}
              </div>
              
              {plan.price && billingPeriod === 'yearly' && (
                <p className="text-sm text-green-600 mb-3">{getSavingsText(plan.price)}</p>
              )}
              
              <p className="text-[#0E0E10]/70 mb-6 text-sm">{plan.description}</p>
              
              <ul className="space-y-2 mb-6 flex-grow text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-pink-100 flex-shrink-0">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span className="text-[#0E0E10]">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                href={plan.name === "Enterprise" ? "/contact" : "/register"} 
                className={`w-full py-2.5 px-4 rounded-md text-sm font-medium text-center ${plan.buttonClass} hover:shadow-md hover:scale-105 transition-all duration-200`}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </Link>
            </div>
          ))}
        </div>

        {/* Full Comparison Button */}
        <div className="mt-12 text-center">
          <Link 
            href="/pricing" 
            className="inline-flex items-center justify-center gap-2 text-[#0E0E10] hover:text-orange-500 font-medium transition-colors duration-200"
          >
            Show Full Comparison
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}