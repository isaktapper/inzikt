import React, { Fragment } from "react"
import Link from "next/link"
import { CheckCircle, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function PricingPage() {
  // Define feature categories and their items for the pricing comparison table
  const featureCategories = [
    {
      name: "Tickets",
      features: [
        { name: "Tickets per month", growth: "500", pro: "1,500", enterprise: "Unlimited" },
        { name: "Extra per ticket", growth: "70¢", pro: "60¢", enterprise: "50¢" },
        { name: "Backlog import", growth: "10 days", pro: "30 days", enterprise: "60 days" },
        { name: "Refresh rate", growth: "Weekly", pro: "Daily", enterprise: "Hourly" },
      ],
    },
    {
      name: "AI Features",
      features: [
        { name: "Smart Tagging", growth: true, pro: true, enterprise: true },
        { name: "AI Analysis", growth: "Standard", pro: "Standard", enterprise: "Advanced" },
        { name: "Sentiment", growth: false, pro: true, enterprise: true },
        { name: "Trends", growth: false, pro: true, enterprise: true },
        { name: "Recommendation", growth: false, pro: false, enterprise: true },
        { name: "Ask anything", growth: false, pro: false, enterprise: true },
      ],
    },
    {
      name: "Integrations",
      features: [
        { name: "Zendesk", growth: true, pro: true, enterprise: true },
        { name: "Intercom", growth: false, pro: true, enterprise: true },
        { name: "Freshdesk", growth: false, pro: true, enterprise: true },
        { name: "Jira", growth: false, pro: false, enterprise: true },
        { name: "Zapier", growth: false, pro: false, enterprise: true },
      ],
    },
    {
      name: "Security",
      features: [
        { name: "End to end encryption", growth: true, pro: true, enterprise: true },
        { name: "MFA", growth: false, pro: false, enterprise: true },
      ],
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-md bg-[#6366F1] p-1">
                <span className="font-bold text-white">K</span>
              </div>
              <span className="font-bold text-xl">Inzikt</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-[#111827] hover:text-[#6366F1]">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-[#111827] hover:text-[#6366F1]">
              How it works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-[#6366F1]">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[#111827] hover:underline">
              Log in
            </Link>
            <Button className="bg-[#6366F1] text-white hover:bg-indigo-600">Sign up</Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-[#111827]">Pricing Plans</h1>
          <p className="text-xl text-[#111827] mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your team's needs with transparent pricing and no hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing cards for mobile */}
      <section className="py-8 bg-white md:hidden">
        <div className="container">
          <div className="space-y-8">
            {[
              {
                name: "Growth",
                price: "$89",
                description: "For growing teams just getting started",
                features: [
                  "500 tickets/month", 
                  "70¢ per extra ticket",
                  "Daily refresh", 
                  "Smart tagging",
                  "Standard AI Analysis",
                ],
              },
              {
                name: "Pro",
                price: "$159",
                description: "For teams that need more power and insights",
                features: [
                  "1,500 tickets/month", 
                  "60¢ per extra ticket",
                  "Hourly refresh", 
                  "Sentiment analysis",
                  "Trends analysis",
                ],
              },
              {
                name: "Enterprise",
                price: "Contact sales",
                description: "For businesses with advanced needs",
                features: [
                  "Unlimited tickets", 
                  "50¢ per extra ticket",
                  "Instant refresh", 
                  "Advanced AI",
                  "All integrations",
                ],
              },
            ].map((plan, i) => (
              <div key={i} className={`border rounded-xl p-6 ${i === 1 ? "border-[#6366F1] bg-[#FAFAFA]" : ""}`}>
                <h3 className="text-xl font-bold mb-2 text-[#111827]">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold text-[#111827]">{plan.price}</span>
                  {plan.price !== "Contact sales" && <span className="text-[#111827]/70">/month</span>}
                </div>
                <p className="text-[#111827]/70 mb-6">{plan.description}</p>
                <Button
                  className={`w-full mb-6 ${i === 1 ? "bg-[#6366F1] text-white hover:bg-indigo-600" : "bg-[#EEF2FF] text-[#111827] hover:bg-indigo-200"}`}
                >
                  Get Started
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-[#6366F1]" />
                      <span className="text-[#111827]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 bg-white hidden md:block">
        <div className="container">
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="bg-[#FAFAFA]">
                  <TableHead className="w-1/3 py-4 text-[#111827] font-bold">Features</TableHead>
                  <TableHead className="w-1/5 py-4 text-center text-[#111827] font-bold">
                    Growth
                    <div className="text-xl font-bold mt-1">$89</div>
                    <div className="text-sm font-normal text-[#111827]/70">per month</div>
                  </TableHead>
                  <TableHead className="w-1/5 py-4 text-center bg-[#EEF2FF] text-[#111827] font-bold">
                    Pro
                    <div className="text-xl font-bold mt-1 text-[#6366F1]">$159</div>
                    <div className="text-sm font-normal text-[#111827]/70">per month</div>
                  </TableHead>
                  <TableHead className="w-1/5 py-4 text-center text-[#111827] font-bold">
                    Enterprise
                    <div className="text-xl font-bold mt-1">Contact Sales</div>
                    <div className="text-sm font-normal text-[#111827]/70">custom pricing</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureCategories.map((category, categoryIndex) => (
                  <Fragment key={categoryIndex}>
                    <TableRow className="bg-[#FAFAFA]">
                      <TableCell colSpan={4} className="py-4 px-4 font-semibold text-[#111827]">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {category.features.map((feature, featureIndex) => (
                      <TableRow key={featureIndex} className="border-t border-gray-100">
                        <TableCell className="py-4 px-4 text-[#111827]">{feature.name}</TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          {feature.growth === true ? (
                            <CheckCircle className="h-5 w-5 text-[#6366F1] mx-auto" />
                          ) : feature.growth === false ? (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-[#111827]">{feature.growth}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center bg-[#EEF2FF]/50">
                          {feature.pro === true ? (
                            <CheckCircle className="h-5 w-5 text-[#6366F1] mx-auto" />
                          ) : feature.pro === false ? (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-[#111827]">{feature.pro}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          {feature.enterprise === true ? (
                            <CheckCircle className="h-5 w-5 text-[#6366F1] mx-auto" />
                          ) : feature.enterprise === false ? (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-[#111827]">{feature.enterprise}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <h3 className="font-bold text-xl mb-2 text-[#111827]">Growth</h3>
              <p className="text-3xl font-bold text-[#111827]">$89</p>
              <p className="text-[#111827]/70 mb-4">per month</p>
              <Button className="w-full bg-[#EEF2FF] text-[#111827] hover:bg-indigo-200">
                Get Started
              </Button>
            </div>
            <div className="text-center p-6 bg-white border border-[#6366F1] rounded-xl shadow-lg">
              <h3 className="font-bold text-xl mb-2 text-[#111827]">Pro</h3>
              <p className="text-3xl font-bold text-[#6366F1]">$159</p>
              <p className="text-[#111827]/70 mb-4">per month</p>
              <Button className="w-full bg-[#6366F1] text-white hover:bg-indigo-600">
                Get Started
              </Button>
            </div>
            <div className="text-center p-6">
              <h3 className="font-bold text-xl mb-2 text-[#111827]">Enterprise</h3>
              <p className="text-3xl font-bold text-[#111827]">Contact Sales</p>
              <p className="text-[#111827]/70 mb-4">custom pricing</p>
              <Button className="w-full bg-[#EEF2FF] text-[#111827] hover:bg-indigo-200">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="py-16 bg-white">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#111827]">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">How does the per-ticket pricing work?</h3>
              <p className="text-[#111827]/80">
                Each plan includes a set number of monthly tickets. If you exceed your limit, you'll be charged the per-ticket rate for each additional ticket. Growth plan charges 70¢, Pro plan 60¢, and Enterprise plan 50¢ per extra ticket.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">What is backlog import?</h3>
              <p className="text-[#111827]/80">
                Backlog import allows you to analyze your historical support tickets. The Growth plan includes 10 days of historical data, Pro plan includes 30 days, and Enterprise plan includes 60 days of backlog import.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">How does the refresh rate work?</h3>
              <p className="text-[#111827]/80">
                The refresh rate determines how often new tickets from your support system are analyzed. Growth plans refresh daily, Pro plans refresh hourly, and Enterprise plans have instant analysis.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">What's the difference between Standard and Advanced AI?</h3>
              <p className="text-[#111827]/80">
                Standard AI provides basic analysis and smart tagging capabilities. Advanced AI includes additional features like recommendations and the ability to ask custom questions about your support data for deeper insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFAFA] border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-md bg-[#6366F1] p-1">
                  <span className="font-bold text-white">K</span>
                </div>
                <span className="font-bold text-xl text-[#111827]">Inzikt</span>
              </div>
              <p className="text-[#111827] mb-4">
                AI-powered customer support analysis to help you build better products.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4 text-[#111827]">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/#features" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-[#111827]">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-[#111827]">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Support
                    </Link>
                  </li>
                  <li>
                    <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#111827]/70">© 2025 Inzikt. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                Terms
              </Link>
              <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                Privacy
              </Link>
              <Link href="/#" className="text-[#111827]/70 hover:text-[#6366F1]">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 