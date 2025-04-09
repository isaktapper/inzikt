"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const useCases = [
  { id: "customer-feedback", label: "Customer Feedback Analysis" },
  { id: "bug-tracking", label: "Bug Tracking & Prioritization" },
  { id: "feature-requests", label: "Feature Request Management" },
  { id: "sentiment-analysis", label: "Customer Sentiment Analysis" },
  { id: "support-efficiency", label: "Support Team Efficiency" },
]

const roles = ["Product Manager", "Customer Support Lead", "CTO", "Founder", "UX Researcher", "Other"]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    useCase: "",
  })
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleUseCase = (id: string) => {
    setSelectedUseCases((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Submit form
      console.log("Form submitted:", formData, selectedUseCases)
      window.location.href = "/onboarding/connect-zendesk"
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isNextDisabled = () => {
    if (step === 1) {
      return !formData.name || !formData.email || !formData.email.includes("@")
    }
    if (step === 2) {
      return !formData.company || !formData.role
    }
    if (step === 3) {
      return selectedUseCases.length === 0
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-[#d8f950] p-1">
              <span className="font-bold text-black">K</span>
            </div>
            <span className="font-bold text-xl">KISA</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                      step === i
                        ? "bg-[#d8f950] text-black"
                        : step > i
                          ? "bg-[#d8f950] text-black"
                          : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {step > i ? <Check className="h-4 w-4" /> : i}
                  </div>
                ))}
              </div>
              <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-[#d8f950] transition-all duration-300 ease-in-out"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-500 text-center">Step {step} of 3</div>
            </div>

            {/* Step 1: Name + Email */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                  <p className="text-gray-600">Let's get started with your Kisa journey</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Name + Role */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Company details</h1>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="Enter your company name"
                      value={formData.company}
                      onChange={(e) => updateFormData("company", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={formData.role} onValueChange={(value) => updateFormData("role", value)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Select Use Case */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">How will you use Kisa?</h1>
                  <p className="text-gray-600">Select all that apply to customize your experience</p>
                </div>

                <div className="space-y-3">
                  {useCases.map((useCase) => (
                    <button
                      key={useCase.id}
                      type="button"
                      onClick={() => toggleUseCase(useCase.id)}
                      className={cn(
                        "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-all",
                        selectedUseCases.includes(useCase.id)
                          ? "border-[#d8f950] bg-[#d8f950]/10"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <span>{useCase.label}</span>
                      {selectedUseCases.includes(useCase.id) && <Check className="h-4 w-4 text-black" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <div></div>
              )}
              <Button
                type="button"
                onClick={nextStep}
                disabled={isNextDisabled()}
                className="bg-[#d8f950] text-black hover:bg-[#c2e340] flex items-center gap-2"
              >
                {step === 3 ? "Complete" : "Next"} {step < 3 && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Sign in link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-black font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
