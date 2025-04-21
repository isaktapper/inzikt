import Link from "next/link"
import { ArrowRight, CheckCircle, MessageSquare, PieChart, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[#6366F1] p-1">
              <span className="font-bold text-white">K</span>
            </div>
            <span className="font-bold text-xl">Inzikt</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-[#111827] hover:text-[#6366F1]">
              Features
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-[#111827] hover:text-[#6366F1]">
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
            <Button asChild className="bg-[#6366F1] text-white hover:bg-indigo-600">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-[#111827]">
            Turn support tickets into <span className="text-[#6366F1]">product insights</span>
          </h1>
          <p className="text-xl text-[#111827] mb-10 max-w-2xl">
            Inzikt uses AI to analyze customer support tickets, helping you identify patterns and improve your product.
          </p>
          <Button asChild className="bg-[#6366F1] text-white hover:bg-indigo-600 text-lg px-8 py-6 h-auto">
            <Link href="/register">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <div className="mt-16 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#EEF2FF] to-indigo-200/30 rounded-xl blur-xl"></div>
            <div className="relative bg-white rounded-xl border shadow-lg overflow-hidden">
              <img
                src="/placeholder.svg?height=600&width=1000"
                alt="Inzikt Dashboard Preview"
                className="w-full max-w-4xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#111827]">Powerful features to transform your support</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#FAFAFA] p-6 rounded-xl">
              <div className="bg-[#EEF2FF] p-3 rounded-lg w-fit mb-4">
                <PieChart className="h-6 w-6 text-[#6366F1]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">AI-Powered Analysis</h3>
              <p className="text-[#111827]">
                Our AI analyzes support tickets to identify trends, sentiment, and common issues.
              </p>
            </div>
            <div className="bg-[#FAFAFA] p-6 rounded-xl">
              <div className="bg-[#EEF2FF] p-3 rounded-lg w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-[#6366F1]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">Smart Tagging</h3>
              <p className="text-[#111827]">
                Automatically categorize tickets with intelligent tags to track issues efficiently.
              </p>
            </div>
            <div className="bg-[#FAFAFA] p-6 rounded-xl">
              <div className="bg-[#EEF2FF] p-3 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-[#6366F1]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">Actionable Insights</h3>
              <p className="text-[#111827]">
                Get clear recommendations on how to improve your product based on customer feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#111827]">How it works</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="bg-[#6366F1] rounded-full w-12 h-12 flex items-center justify-center font-bold text-white mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">Connect</h3>
              <p className="text-[#111827]">Connect Inzikt to your support platform with our simple integrations.</p>
            </div>
            <div className="hidden md:block w-12 h-1 bg-[#EEF2FF] md:w-1 md:h-12"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="bg-[#6366F1] rounded-full w-12 h-12 flex items-center justify-center font-bold text-white mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">Analyze</h3>
              <p className="text-[#111827]">Our AI analyzes your tickets to identify patterns and insights.</p>
            </div>
            <div className="hidden md:block w-12 h-1 bg-[#EEF2FF] md:w-1 md:h-12"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="bg-[#6366F1] rounded-full w-12 h-12 flex items-center justify-center font-bold text-white mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#111827]">Improve</h3>
              <p className="text-[#111827]">Use the insights to improve your product and customer experience.</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Button asChild className="bg-[#6366F1] text-white hover:bg-indigo-600">
              <Link href="/how-it-works">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-xl font-medium text-center text-[#111827] mb-8">Integrates with your favorite tools</h2>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {["Zendesk", "Intercom", "Gmail", "Slack", "HelpScout"].map((tool) => (
              <div
                key={tool}
                className="flex items-center justify-center h-12 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
              >
                <div className="bg-[#EEF2FF] rounded-md px-4 py-2">
                  <span className="font-medium text-[#111827]">{tool}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#111827]">What our customers say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Product Manager at TechCorp",
                quote:
                  "Inzikt helped us identify a critical issue that was affecting 30% of our users. We fixed it and saw immediate improvements in our satisfaction scores.",
              },
              {
                name: "Michael Chen",
                role: "CTO at StartupX",
                quote:
                  "The AI-powered insights have transformed how we prioritize our product roadmap. We're now building features our customers actually want.",
              },
              {
                name: "Emma Williams",
                role: "Support Lead at SaaS Inc",
                quote:
                  "My support team is now much more efficient. Inzikt automatically categorizes tickets so we can focus on solving problems instead of organizing them.",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#6366F1] rounded-full w-10 h-10 flex items-center justify-center font-bold text-white">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">{testimonial.name}</p>
                    <p className="text-sm text-[#111827]/70">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-[#111827]">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4 text-[#111827]">Simple, transparent pricing</h2>
          <p className="text-xl text-[#111827] text-center mb-12 max-w-2xl mx-auto">
            Choose the plan that's right for your business
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Growth",
                price: "$89",
                description: "For growing teams just getting started",
                features: [
                  "500 tickets/month", 
                  "Daily refresh", 
                  "Smart tagging"
                ],
              },
              {
                name: "Pro",
                price: "$159",
                description: "For teams that need more power and insights",
                features: [
                  "1500 tickets/month", 
                  "Hourly refresh", 
                  "Sentiment analysis"
                ],
              },
              {
                name: "Enterprise",
                price: "Contact sales",
                description: "For businesses with advanced needs",
                features: [
                  "Unlimited tickets", 
                  "Instant refresh", 
                  "Advanced AI"
                ],
              },
            ].map((plan, i) => (
              <div key={i} className={`border rounded-xl p-6 ${i === 1 ? "border-[#6366F1] shadow-lg relative" : ""}`}>
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#6366F1] text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
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
          <div className="mt-8 text-center">
            <Link href="/pricing" className="text-[#6366F1] font-medium hover:underline">
              Show full comparison
            </Link>
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
                    <Link href="#features" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-[#111827]">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-[#111827]">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                      Support
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
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
              <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                Terms
              </Link>
              <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                Privacy
              </Link>
              <Link href="#" className="text-[#111827]/70 hover:text-[#6366F1]">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
