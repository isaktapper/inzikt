"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="fixed w-full z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-[#0E0E10] hover:text-orange-400 transition-colors duration-200">
              Features
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-orange-400">
              How it works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-[#0E0E10] hover:text-orange-400 transition-colors duration-200">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[#0E0E10] hover:underline decoration-pink-500 decoration-2 transition-all duration-200">
              Log in
            </Link>
            <Button asChild className="bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:scale-105 transition-all duration-200">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[#0E0E10] animate-fade-in">
              Turning support tickets into <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">actionable insights</span>
            </h1>
            <p className="text-xl text-[#0E0E10] mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              See how our AI-powered platform transforms your support data into product improvements
            </p>
            <Button asChild className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-lg px-8 py-6 h-auto hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Link href="/register">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Process Section */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-16 text-[#0E0E10]">How Inzikt works</h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: "Connect your support platform",
                description: "Simply connect your existing support system with our no-code integration. We support Zendesk, Intercom, Gmail, and more.",
                image: "/placeholder.svg?height=200&width=350"
              },
              {
                step: 2,
                title: "AI analyzes your tickets",
                description: "Our AI automatically categorizes, tags, and analyzes the content and sentiment of your support tickets.",
                image: "/placeholder.svg?height=200&width=350"
              },
              {
                step: 3,
                title: "Uncover actionable insights",
                description: "Get clear visualizations and recommendations that help you identify patterns and prioritize product improvements.",
                image: "/placeholder.svg?height=200&width=350"
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center font-bold text-white mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0E0E10]">{item.title}</h3>
                <p className="text-[#0E0E10]/80 mb-6 max-w-xs">{item.description}</p>
                <div className="rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 bg-white mb-3">
                  <img src={item.image} alt={item.title} className="w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-[#0E0E10]">
              <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">Simple integrations</span> with your tools
            </h2>
            <p className="text-xl text-[#0E0E10] max-w-2xl mx-auto">
              Connect Inzikt to your support platform in just a few clicks
            </p>
          </div>

          <div className="bg-gradient-to-b from-white to-orange-50 rounded-2xl border p-8 md:p-12 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-[#0E0E10]">Easy setup process</h3>
                <div className="space-y-4">
                  {[
                    "Sign up for Inzikt and log into your dashboard",
                    "Select your support platform from our integration menu",
                    "Authorize the connection (we only request read access)",
                    "Select the ticket fields you want to analyze",
                    "Watch as Inzikt automatically imports and analyzes your data"
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold text-white mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-[#0E0E10]">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <h4 className="font-medium mb-4 text-[#0E0E10]">Supported platforms</h4>
                  <div className="flex flex-wrap gap-3">
                    {["Zendesk", "Intercom", "Gmail", "Slack", "HelpScout"].map((platform) => (
                      <div key={platform} className="bg-white rounded-md px-3 py-1.5 border text-sm font-medium text-[#0E0E10]">
                        {platform}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border shadow-md">
                <h4 className="font-medium mb-4 text-[#0E0E10]">Connect to Zendesk</h4>
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#0E0E10]">Zendesk domain</label>
                    <div className="flex">
                      <input type="text" placeholder="yourcompany" className="flex-1 rounded-l-md border border-r-0 p-2 text-[#0E0E10]" />
                      <div className="bg-gray-100 border border-l-0 rounded-r-md px-3 flex items-center text-gray-500">
                        .zendesk.com
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#0E0E10]">API Token</label>
                    <input type="password" placeholder="••••••••••••••••" className="w-full rounded-md border p-2" />
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-md hover:scale-105 transition-all duration-200">
                  Connect Zendesk
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-[#0E0E10]">
              What you'll gain with Inzikt
            </h2>
            <p className="text-xl text-[#0E0E10] max-w-2xl mx-auto">
              Transform your customer support data into a strategic asset
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Understand what matters to customers",
                description: "Automatically identify the most common issues and requests in your support tickets.",
                features: [
                  "AI-powered ticket categorization",
                  "Topic clustering to find patterns",
                  "Sentiment analysis across categories"
                ]
              },
              {
                title: "Track issues over time",
                description: "See how support issues evolve and identify emerging problems before they become critical.",
                features: [
                  "Trend analysis across timeframes",
                  "Anomaly detection for sudden spikes",
                  "Correlation with product releases"
                ]
              },
              {
                title: "Prioritize product improvements",
                description: "Make data-driven decisions about what to fix first based on customer impact.",
                features: [
                  "Impact scoring for each issue type",
                  "Volume and sentiment weighting",
                  "Integration with product management tools"
                ]
              },
              {
                title: "Measure customer satisfaction",
                description: "Track how your product changes affect customer sentiment and support volume.",
                features: [
                  "Before/after release comparisons",
                  "Customer satisfaction tracking",
                  "Support volume reduction metrics"
                ]
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-xl font-bold mb-3 text-[#0E0E10]">{feature.title}</h3>
                <p className="mb-6 text-[#0E0E10]/80">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-orange-400" />
                      <span className="text-[#0E0E10]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-[#0E0E10]">
              Your insights dashboard
            </h2>
            <p className="text-xl text-[#0E0E10] max-w-2xl mx-auto">
              A comprehensive view of your support data
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01]">
              <div className="border-b p-4 flex items-center gap-4 bg-gradient-to-r from-orange-50 to-pink-50">
                <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-8 w-auto" />
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-[#0E0E10]">Dashboard</h3>
                    <div className="bg-white rounded-md px-2 py-0.5 border text-xs font-medium text-[#0E0E10]">
                      Last 30 days
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-orange-500 font-medium">Overview</div>
                    <div className="text-[#0E0E10]/70">Categories</div>
                    <div className="text-[#0E0E10]/70">Trends</div>
                    <div className="text-[#0E0E10]/70">Insights</div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg border p-4">
                    <div className="text-sm font-medium mb-2 text-[#0E0E10]">Total Tickets</div>
                    <div className="text-3xl font-bold text-[#0E0E10]">1,542</div>
                    <div className="text-sm text-green-500 mt-1">+12% from last month</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="text-sm font-medium mb-2 text-[#0E0E10]">Average Sentiment</div>
                    <div className="text-3xl font-bold text-[#0E0E10]">7.2</div>
                    <div className="text-sm text-green-500 mt-1">+0.5 from last month</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="text-sm font-medium mb-2 text-[#0E0E10]">Top Category</div>
                    <div className="text-3xl font-bold text-[#0E0E10]">Billing</div>
                    <div className="text-sm text-orange-500 mt-1">32% of all tickets</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h4 className="text-sm font-medium mb-4 text-[#0E0E10]">Ticket Categories</h4>
                  <div className="h-64 flex items-end gap-8 pt-6 border-b border-t">
                    {[65, 42, 30, 25, 15, 10].map((height, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className={`w-12 bg-gradient-to-t from-orange-400 to-pink-500 rounded-t-sm`} style={{ height: `${height}%` }}></div>
                        <div className="mt-2 text-xs text-[#0E0E10]">
                          {["Billing", "Login", "Export", "Mobile", "API", "Other"][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-[#0E0E10]">Recent Insights</h4>
                  <div className="space-y-2">
                    <div className="p-2 border rounded-md text-sm text-[#0E0E10]">
                      <span className="font-medium">Login issues</span> have increased by 15% this week
                    </div>
                    <div className="p-2 border rounded-md text-sm text-[#0E0E10]">
                      <span className="font-medium">Billing questions</span> are most frequent on Mondays
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-orange-100 transform hover:scale-[1.02] transition-all duration-500">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#0E0E10]">
              Start analyzing your support <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">today</span>
            </h2>
            <p className="text-xl text-[#0E0E10] mb-10 max-w-2xl mx-auto">
              Get actionable insights with Inzikt in minutes.
            </p>
            <Button 
              className="bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:scale-105 transition-all duration-300 text-lg px-8 py-6 h-auto"
              asChild
            >
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