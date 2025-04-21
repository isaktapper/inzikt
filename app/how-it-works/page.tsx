"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-[#6366F1] p-1">
              <span className="font-bold text-white">K</span>
            </div>
            <span className="font-bold text-xl">Inzikt</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-[#111827] hover:text-[#6366F1]">
              Features
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-[#6366F1]">
              How it works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-[#111827] hover:text-[#6366F1]">
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

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#111827] animate-fade-in">
            How Inzikt Works
          </h1>
          <p className="text-xl text-[#111827] mb-10 max-w-2xl mx-auto animate-fade-in animation-delay-200">
            From connection to insights in just a few clicks
          </p>
          <div className="animate-fade-in animation-delay-400">
            <Button 
              className="bg-[#6366F1] text-white hover:bg-indigo-600 text-lg px-8 py-6 h-auto"
              asChild
            >
              <Link href="/register">
                Get started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Step-by-step Walkthrough */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          {/* Step 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24 animate-slide-up">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-[#6366F1] rounded-full w-10 h-10 flex items-center justify-center font-bold text-white mr-3">
                  1
                </div>
                <h2 className="text-2xl font-bold text-[#111827]">Connect your support system</h2>
              </div>
              <p className="text-[#111827] text-lg mb-6">
                Securely connect Zendesk or your preferred helpdesk tool in seconds.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">No code installation required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Secure API connection</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Read-only access to tickets</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#FAFAFA] p-6 rounded-xl shadow-md">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4 text-[#111827]">Connect to Zendesk</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Zendesk Subdomain</label>
                    <input 
                      type="text" 
                      placeholder="your-company" 
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                    <div className="text-xs text-gray-500 mt-1">.zendesk.com</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">API Token</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••••••" 
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Admin Email</label>
                    <input 
                      type="email" 
                      placeholder="admin@yourcompany.com" 
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                  </div>
                  <Button className="w-full bg-[#6366F1] text-white hover:bg-indigo-600 mt-2">
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24 animate-slide-up animation-delay-200">
            <div className="order-2 md:order-1 bg-[#FAFAFA] p-6 rounded-xl shadow-md">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4 text-[#111827]">Importing tickets</h3>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[#111827]">Progress</span>
                    <span className="text-sm text-[#111827]">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-[#6366F1] h-2.5 rounded-full" style={{ width: "68%" }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Analyzing 342 of 500 tickets</p>
                </div>
                <div className="space-y-3 mt-6">
                  {[
                    "Ticket #5423: Product not working after update",
                    "Ticket #5422: Can't login to account",
                    "Ticket #5421: How do I export my data?",
                    "Ticket #5420: Feature request: dark mode"
                  ].map((ticket, i) => (
                    <div key={i} className="flex items-center p-2 border rounded-md">
                      <div className={`h-2 w-2 rounded-full mr-2 ${i < 2 ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className="text-sm text-[#111827]">{ticket}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center mb-4">
                <div className="bg-[#6366F1] rounded-full w-10 h-10 flex items-center justify-center font-bold text-white mr-3">
                  2
                </div>
                <h2 className="text-2xl font-bold text-[#111827]">Import tickets & analyze</h2>
              </div>
              <p className="text-[#111827] text-lg mb-6">
                Inzikt fetches recent support tickets and starts AI analysis immediately.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Fast batch processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Advanced AI models for accuracy</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Real-time analysis progress</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center animate-slide-up animation-delay-400">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-[#6366F1] rounded-full w-10 h-10 flex items-center justify-center font-bold text-white mr-3">
                  3
                </div>
                <h2 className="text-2xl font-bold text-[#111827]">Get AI insights automatically</h2>
              </div>
              <p className="text-[#111827] text-lg mb-6">
                See auto-generated tags, summaries, and trends on your personal dashboard.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Smart categorization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Sentiment analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#6366F1]" />
                  <span className="text-[#111827]">Actionable recommendations</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#FAFAFA] p-6 rounded-xl shadow-md">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4 text-[#111827] flex justify-between">
                  <span>Dashboard</span>
                  <span className="text-sm text-gray-500">Last updated: 5 min ago</span>
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-[#EEF2FF] p-3 rounded-lg">
                    <div className="text-sm text-[#111827]/70">Total Tickets</div>
                    <div className="text-2xl font-bold text-[#111827]">500</div>
                  </div>
                  <div className="bg-[#EEF2FF] p-3 rounded-lg">
                    <div className="text-sm text-[#111827]/70">Analyzed</div>
                    <div className="text-2xl font-bold text-[#111827]">482</div>
                  </div>
                  <div className="bg-[#EEF2FF] p-3 rounded-lg">
                    <div className="text-sm text-[#111827]/70">Tags</div>
                    <div className="text-2xl font-bold text-[#111827]">24</div>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-[#111827]">Top Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Login Issue", "Billing", "Feature Request", "Bug", "UX"].map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-[#EEF2FF] text-[#6366F1] rounded-md text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-[#111827]">Recent Insights</h4>
                  <div className="space-y-2">
                    <div className="p-2 border rounded-md text-sm text-[#111827]">
                      <span className="font-medium">Login issues</span> have increased by 15% this week
                    </div>
                    <div className="p-2 border rounded-md text-sm text-[#111827]">
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
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#111827] animate-fade-in">
            Start analyzing your support today
          </h2>
          <p className="text-xl text-[#111827] mb-10 max-w-2xl mx-auto animate-fade-in animation-delay-200">
            Get actionable insights with Inzikt in minutes.
          </p>
          <div className="animate-fade-in animation-delay-400">
            <Button 
              className="bg-[#6366F1] text-white hover:bg-indigo-600 text-lg px-8 py-6 h-auto"
              asChild
            >
              <Link href="/register">
                Get started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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