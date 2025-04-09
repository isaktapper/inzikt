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
            <div className="rounded-md bg-[#d8f950] p-1">
              <span className="font-bold text-black">K</span>
            </div>
            <span className="font-bold text-xl">KISA</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-[#d8f950]">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-[#d8f950]">
              How it works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-[#d8f950]">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Log in
            </Link>
            <Button className="bg-[#d8f950] text-black hover:bg-[#c2e340]">Sign up</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Turn support tickets into <span className="text-[#d8f950]">product insights</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl">
            Kisa uses AI to analyze customer support tickets, helping you identify patterns and improve your product.
          </p>
          <Button className="bg-[#d8f950] text-black hover:bg-[#c2e340] text-lg px-8 py-6 h-auto">
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="mt-16 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#d8f950]/30 to-blue-500/30 rounded-xl blur-xl"></div>
            <div className="relative bg-white rounded-xl border shadow-lg overflow-hidden">
              <img
                src="/placeholder.svg?height=600&width=1000"
                alt="Kisa Dashboard Preview"
                className="w-full max-w-4xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful features to transform your support</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-[#d8f950]/20 p-3 rounded-lg w-fit mb-4">
                <PieChart className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes support tickets to identify trends, sentiment, and common issues.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-[#d8f950]/20 p-3 rounded-lg w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Tagging</h3>
              <p className="text-gray-600">
                Automatically categorize tickets with intelligent tags to track issues efficiently.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-[#d8f950]/20 p-3 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">Actionable Insights</h3>
              <p className="text-gray-600">
                Get clear recommendations on how to improve your product based on customer feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="bg-[#d8f950] rounded-full w-12 h-12 flex items-center justify-center font-bold text-black mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Connect</h3>
              <p className="text-gray-600">Connect Kisa to your support platform with our simple integrations.</p>
            </div>
            <div className="hidden md:block w-12 h-1 bg-gray-200 md:w-1 md:h-12"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="bg-[#d8f950] rounded-full w-12 h-12 flex items-center justify-center font-bold text-black mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Analyze</h3>
              <p className="text-gray-600">Our AI analyzes your tickets to identify patterns and insights.</p>
            </div>
            <div className="hidden md:block w-12 h-1 bg-gray-200 md:w-1 md:h-12"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="bg-[#d8f950] rounded-full w-12 h-12 flex items-center justify-center font-bold text-black mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Improve</h3>
              <p className="text-gray-600">Use the insights to improve your product and customer experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-xl font-medium text-center text-gray-600 mb-8">Integrates with your favorite tools</h2>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {["Zendesk", "Intercom", "Gmail", "Slack", "HelpScout"].map((tool) => (
              <div
                key={tool}
                className="flex items-center justify-center h-12 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
              >
                <div className="bg-gray-200 rounded-md px-4 py-2">
                  <span className="font-medium">{tool}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">What our customers say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Product Manager at TechCorp",
                quote:
                  "Kisa helped us identify a critical issue that was affecting 30% of our users. We fixed it and saw immediate improvements in our satisfaction scores.",
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
                  "My support team is now much more efficient. Kisa automatically categorizes tickets so we can focus on solving problems instead of organizing them.",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#d8f950] rounded-full w-10 h-10 flex items-center justify-center font-bold text-black">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Choose the plan that's right for your business
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$49",
                description: "Perfect for small teams just getting started",
                features: ["500 tickets/month", "Basic AI analysis", "Email support", "1 user"],
              },
              {
                name: "Growth",
                price: "$99",
                description: "For growing teams with more support volume",
                features: [
                  "2,000 tickets/month",
                  "Advanced AI insights",
                  "Priority support",
                  "5 users",
                  "Custom tagging",
                ],
              },
              {
                name: "Professional",
                price: "$199",
                description: "For businesses with complex support needs",
                features: [
                  "Unlimited tickets",
                  "Enterprise AI features",
                  "Dedicated support",
                  "Unlimited users",
                  "API access",
                  "Custom integrations",
                ],
              },
            ].map((plan, i) => (
              <div key={i} className={`border rounded-xl p-6 ${i === 1 ? "border-[#d8f950] shadow-lg relative" : ""}`}>
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#d8f950] text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <Button
                  className={`w-full mb-6 ${i === 1 ? "bg-[#d8f950] text-black hover:bg-[#c2e340]" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                >
                  Get started
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-[#d8f950]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-md bg-[#d8f950] p-1">
                  <span className="font-bold text-black">K</span>
                </div>
                <span className="font-bold text-xl">KISA</span>
              </div>
              <p className="text-gray-600 mb-4">
                AI-powered customer support analysis to help you build better products.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Support
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">© 2025 Kisa. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                Terms
              </Link>
              <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                Privacy
              </Link>
              <Link href="#" className="text-gray-600 hover:text-[#d8f950]">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
