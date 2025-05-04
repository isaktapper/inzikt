'use client';

import React, { Fragment, useState } from "react"
import Link from "next/link"
import { CheckCircle, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/LandingHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { ArrowRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Define feature types
type FeatureValue = boolean | string;

interface Feature {
  name: string;
  starter: FeatureValue;
  growth: FeatureValue;
  pro: FeatureValue;
  enterprise: FeatureValue;
  description?: string;
}

interface FeatureCategory {
  name: string;
  features: Feature[];
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('yearly')
  const yearlyDiscount = 0.85 // 15% discount

  const getPriceDisplay = (monthlyPrice: number) => {
    if (billingPeriod === 'yearly') {
      const yearlyPrice = monthlyPrice * yearlyDiscount
      return `$${Math.round(yearlyPrice)}`
    }
    return `$${monthlyPrice}`
  }

  const getSavingsText = (monthlyPrice: number) => {
    if (billingPeriod === 'yearly') {
      const savings = monthlyPrice * 12 * (1 - yearlyDiscount)
      return `Save $${Math.round(savings)} a year`
    }
    return null
  }

  const getBillingText = () => {
    if (billingPeriod === 'yearly') {
      return '/mo, billed annually'
    }
    return '/month'
  }

  // Define feature categories and their items for the pricing comparison table
  const featureCategories: FeatureCategory[] = [
    {
      name: "Plan Details",
      features: [
        { name: "Tickets / month", starter: "500", growth: "2,000", pro: "10,000", enterprise: "Unlimited" },
        { name: "Extra tickets pack", starter: "100 tickets for $15", growth: "100 tickets for $15", pro: "100 tickets for $15", enterprise: "–" },
        { name: "Backlog import", starter: "5 days", growth: "15 days", pro: "30 days", enterprise: "90 days" },
        { name: "Refresh frequency", starter: "Weekly", growth: "Daily", pro: "Hourly", enterprise: "Real-time" },
      ],
    },
    {
      name: "AI Features",
      features: [
        { name: "AI Capability", starter: "Standard AI", growth: "Standard AI", pro: "Advanced AI", enterprise: "Dedicated AI" },
        { name: "Auto-tagging", starter: true, growth: true, pro: true, enterprise: true },
        { name: "AI summarization", starter: true, growth: true, pro: true, enterprise: true },
        { name: "Trends & insights", starter: false, growth: true, pro: true, enterprise: true },
        { name: "Recommendations", starter: false, growth: false, pro: true, enterprise: true },
        { name: "Ask anything", starter: false, growth: false, pro: false, enterprise: true },
      ],
    },
    {
      name: "Integrations",
      features: [
        { name: "Zendesk integration", starter: true, growth: true, pro: true, enterprise: true },
        { name: "Freshdesk integration", starter: true, growth: true, pro: true, enterprise: true },
        { name: "Intercom integration", starter: false, growth: false, pro: false, enterprise: true },
        { name: "Jira integration", starter: false, growth: false, pro: false, enterprise: true },
        { name: "Zapier integration", starter: false, growth: false, pro: false, enterprise: true },
        { name: "API access", starter: false, growth: false, pro: true, enterprise: true },
      ],
    },
    {
      name: "Support & Security",
      features: [
        { name: "Support / SLA", starter: "Email support", growth: "Email support", pro: "Priority email", enterprise: "Dedicated CSM + SLA" },
        { name: "End-to-end encryption", starter: true, growth: true, pro: true, enterprise: true },
        { name: "MFA", starter: false, growth: false, pro: true, enterprise: true },
      ],
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <LandingHeader />

      {/* Hero section - decrease padding */}
      <section className="pt-24 pb-8 bg-white">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-[#0E0E10] animate-fade-in">
            Simple, <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">transparent</span> pricing
          </h1>
          <p className="text-xl text-[#0E0E10] mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
            Choose the perfect plan for your team's needs with no hidden fees.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex flex-col items-center justify-center gap-2 mb-8">
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
      </section>

      {/* Pricing cards for mobile - adjust top padding */}
      <section id="pricing" className="pt-0 pb-8 md:hidden bg-white">
        <div className="container px-4">
          <Tabs defaultValue="growth" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="starter">Starter</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="pro">Pro</TabsTrigger>
              <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
            </TabsList>
            
            <TabsContent value="starter" className="border rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Starter</h3>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#0E0E10]">{getPriceDisplay(59)}</span>
                  <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-600 mb-3">{getSavingsText(59)}</p>
                )}
                <p className="text-[#0E0E10]/70 mb-6">For small teams just getting started with ticket analysis</p>
                <Button className="w-full mb-6 bg-[#0E0E10] text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200">
                  Get Started
                </Button>
              </div>
              <div className="space-y-4">
                {featureCategories.map((category) => (
                  <div key={category.name} className="border-t pt-4">
                    <h4 className="font-medium mb-2 text-[#0E0E10]">{category.name}</h4>
                    <ul className="space-y-2">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-2">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.starter}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="growth" className="border border-orange-300 rounded-xl p-6 shadow-md relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Growth</h3>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#0E0E10]">{getPriceDisplay(149)}</span>
                  <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-600 mb-3">{getSavingsText(149)}</p>
                )}
                <p className="text-[#0E0E10]/70 mb-6">For growing teams needing deeper ticket insights</p>
                <Button className="w-full mb-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:scale-105 transition-all duration-200">
                  Get Started
                </Button>
              </div>
              <div className="space-y-4">
                {featureCategories.map((category) => (
                  <div key={category.name} className="border-t pt-4">
                    <h4 className="font-medium mb-2 text-[#0E0E10]">{category.name}</h4>
                    <ul className="space-y-2">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-2">
                          {typeof feature.growth === 'boolean' ? (
                            feature.growth ? (
                              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.growth}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pro" className="border rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Pro</h3>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#0E0E10]">{getPriceDisplay(299)}</span>
                  <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-600 mb-3">{getSavingsText(299)}</p>
                )}
                <p className="text-[#0E0E10]/70 mb-6">For teams that need advanced AI and in-depth insights</p>
                <Button className="w-full mb-6 bg-[#0E0E10] text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200">
                  Get Started
                </Button>
              </div>
              <div className="space-y-4">
                {featureCategories.map((category) => (
                  <div key={category.name} className="border-t pt-4">
                    <h4 className="font-medium mb-2 text-[#0E0E10]">{category.name}</h4>
                    <ul className="space-y-2">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-2">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.pro}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="enterprise" className="border rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Enterprise</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <span className="text-xl font-bold text-[#0E0E10]">Custom Pricing</span>
                </div>
                <p className="text-[#0E0E10]/70 mb-6">For businesses with advanced needs and custom requirements</p>
                <Button className="w-full mb-6 bg-[#0E0E10] text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200">
                  Contact Sales
                </Button>
              </div>
              <div className="space-y-4">
                {featureCategories.map((category) => (
                  <div key={category.name} className="border-t pt-4">
                    <h4 className="font-medium mb-2 text-[#0E0E10]">{category.name}</h4>
                    <ul className="space-y-2">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-2">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.enterprise}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pricing table for desktop - adjust top padding */}
      <section className="pt-0 pb-16 hidden md:block bg-white">
        <div className="container px-4">
          <div className="w-full border rounded-xl overflow-hidden">
            <div className="grid grid-cols-5">
              {/* Features column */}
              <div className="border-r">
                <div className="h-48 flex items-end p-6">
                  <h3 className="text-lg font-medium text-[#0E0E10]">Features</h3>
                </div>

                {featureCategories.map((category, i) => (
                  <div key={category.name} className={`border-t p-6 ${i % 2 === 1 ? 'bg-orange-50' : ''}`}>
                    <h4 className="font-medium mb-4 text-[#0E0E10] border-b border-orange-100 pb-2">{category.name}</h4>
                    <ul className="space-y-6">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="h-10 flex items-center">
                          <span className="font-medium text-[#0E0E10]">{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Starter column */}
              <div className="border-r">
                <div className="h-48 p-6 flex flex-col items-center justify-end text-center">
                  <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Starter</h3>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-2xl font-bold text-[#0E0E10]">{getPriceDisplay(59)}</span>
                    <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mb-2">{getSavingsText(59)}</p>
                  )}
                  <Button className="w-full bg-[#0E0E10] text-white hover:scale-105 hover:bg-gray-800 transition-all duration-200">
                    Get Started
                  </Button>
                </div>
                
                {featureCategories.map((category, i) => (
                  <div key={category.name} className={`border-t p-6 ${i % 2 === 1 ? 'bg-orange-50' : ''}`}>
                    <div className="invisible mb-4 border-b border-orange-100 pb-2">{category.name}</div>
                    <ul className="space-y-6">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="h-10 flex items-center justify-center">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-pink-100">
                                <CheckCircle className="h-4 w-4 text-orange-400" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                <X className="h-4 w-4 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.starter}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Growth column */}
              <div className="border-r relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                  POPULAR
                </div>
                <div className="h-48 p-6 flex flex-col items-center justify-end text-center shadow-md bg-orange-50/50 relative">
                  <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Growth</h3>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-2xl font-bold text-[#0E0E10]">{getPriceDisplay(149)}</span>
                    <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mb-2">{getSavingsText(149)}</p>
                  )}
                  <Button className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:scale-105 transition-all duration-200">
                    Get Started
                  </Button>
                </div>
                
                {featureCategories.map((category, i) => (
                  <div key={category.name} className={`border-t p-6 ${i % 2 === 1 ? 'bg-orange-50' : ''}`}>
                    <div className="invisible mb-4 border-b border-orange-100 pb-2">{category.name}</div>
                    <ul className="space-y-6">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="h-10 flex items-center justify-center">
                          {typeof feature.growth === 'boolean' ? (
                            feature.growth ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-pink-100">
                                <CheckCircle className="h-4 w-4 text-orange-400" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                <X className="h-4 w-4 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.growth}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Pro column */}
              <div className="border-r relative">
                <div className="h-48 p-6 flex flex-col items-center justify-end text-center relative">
                  <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Pro</h3>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-2xl font-bold text-[#0E0E10]">{getPriceDisplay(299)}</span>
                    <span className="text-[#0E0E10]/70">{getBillingText()}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mb-2">{getSavingsText(299)}</p>
                  )}
                  <Button className="w-full bg-[#0E0E10] text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200">
                    Get Started
                  </Button>
                </div>
                
                {featureCategories.map((category, i) => (
                  <div key={category.name} className={`border-t p-6 ${i % 2 === 1 ? 'bg-orange-50' : ''}`}>
                    <div className="invisible mb-4 border-b border-orange-100 pb-2">{category.name}</div>
                    <ul className="space-y-6">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="h-10 flex items-center justify-center">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-pink-100">
                                <CheckCircle className="h-4 w-4 text-orange-400" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                <X className="h-4 w-4 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.pro}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Enterprise column */}
              <div>
                <div className="h-48 p-6 flex flex-col items-center justify-end text-center">
                  <h3 className="text-xl font-bold mb-2 text-[#0E0E10]">Enterprise</h3>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <span className="text-xl font-bold text-[#0E0E10]">Custom Pricing</span>
                  </div>
                  <Button className="w-full bg-[#0E0E10] text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200">
                    Contact Sales
                  </Button>
                </div>
                
                {featureCategories.map((category, i) => (
                  <div key={category.name} className={`border-t p-6 ${i % 2 === 1 ? 'bg-orange-50' : ''}`}>
                    <div className="invisible mb-4 border-b border-orange-100 pb-2">{category.name}</div>
                    <ul className="space-y-6">
                      {category.features.map((feature) => (
                        <li key={feature.name} className="h-10 flex items-center justify-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-pink-100">
                                <CheckCircle className="h-4 w-4 text-orange-400" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                <X className="h-4 w-4 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-[#0E0E10]">
                              {feature.enterprise}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gradient-to-b from-white to-orange-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#0E0E10]">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
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
                  answer: "You can purchase extra tickets packs: 100 additional tickets for $15. This applies to all plans except Enterprise, which has unlimited tickets."
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
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg overflow-hidden bg-white">
                  <AccordionTrigger className="px-6 py-4 hover:bg-orange-50 transition-colors duration-200 text-[#0E0E10] font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-[#0E0E10]">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-white to-orange-50 p-10 rounded-2xl shadow-lg border border-orange-100 transform hover:scale-[1.02] transition-all duration-500">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#0E0E10]">
              Start analyzing your tickets <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">today</span>
            </h2>
            <p className="text-xl text-[#0E0E10] mb-8">
              14-day free trial, no credit card required
            </p>
            <Button asChild className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-lg px-10 py-7 h-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <Link href="/register">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-8 w-auto" />
              </Link>
              <p className="text-[#0E0E10] mb-4">
                AI-powered customer support analysis to help you build better products.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4 text-[#0E0E10]">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/#features" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/#" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-[#0E0E10]">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-[#0E0E10]">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/help" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-[#0E0E10]/70 hover:text-orange-400 transition-colors duration-200">
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t">
            <p className="text-sm text-[#0E0E10]/60">
              © {new Date().getFullYear()} Inzikt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 