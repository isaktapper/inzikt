"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/utils/supabase/client"

const useCases = [
  { id: "customer-feedback", label: "Customer Feedback Analysis" },
  { id: "bug-tracking", label: "Bug Tracking & Prioritization" },
  { id: "feature-requests", label: "Feature Request Management" },
  { id: "sentiment-analysis", label: "Customer Sentiment Analysis" },
  { id: "support-efficiency", label: "Support Team Efficiency" },
]

const roles = ["Product Manager", "Customer Support Lead", "CTO", "Founder", "UX Researcher", "Other"]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supabase] = useState(() => createClientSupabaseClient())
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Starting signup process...")
      
      // Sign up with Supabase - include redirect URL
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.name,
            company: formData.company,
            role: formData.role
          }
        }
      })

      if (authError) {
        console.error("Auth error during signup:", authError)
        throw authError
      }

      console.log("Auth signup response:", authData)

      // Create the user profile in the profiles table
      if (authData.user) {
        try {
          // Insert into profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: formData.name,
              company: formData.company,
              role: formData.role,
              use_cases: selectedUseCases
            })

          if (profileError) {
            console.error("Profile creation error:", profileError)
            // Don't throw here - we want to still show the email verification message
          }
        } catch (profileError) {
          console.error("Error creating profile:", profileError)
          // Continue to show success message even if profile creation fails
        }

        // Email confirmation is almost always required with Supabase
        setSuccess(`A verification link has been sent to ${formData.email}. Please check your email and click the link to verify your account.`)
        return
      }

      // If we somehow get here without a user, show an error
      if (!authData.user) {
        throw new Error("Failed to create account - no user returned")
      }
      
    } catch (error: any) {
      console.error("Signup error:", error)
      
      // Handle specific error cases
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Please sign in or use a different email.")
      } else {
        setError(error.message || "Failed to create account")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      await handleSignUp()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isNextDisabled = () => {
    if (step === 1) {
      return !formData.name || !formData.email || !formData.password || !formData.email.includes("@") || formData.password.length < 6
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
            <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-10 w-10" style={{ filter: 'brightness(0) saturate(100%) invert(41%) sepia(94%) saturate(749%) hue-rotate(202deg) brightness(99%) contrast(101%)' }} />
            <span className="font-bold text-xl text-[#6366F1]">Inzikt</span>
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

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Name + Email */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                  <p className="text-gray-600">Let's get started with your Inzikt journey</p>
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

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                    />
                    <p className="text-sm text-gray-500">Must be at least 6 characters</p>
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
                  <h1 className="text-2xl font-bold mb-2">How will you use Inzikt?</h1>
                  <p className="text-gray-600">Select all that apply to customize your experience</p>
                </div>

                <div className="space-y-3">
                  {useCases.map((useCase) => (
                    <button
                      key={useCase.id}
                      type="button"
                      onClick={() => toggleUseCase(useCase.id)}
                      className={cn(
                        "w-full p-4 text-left border rounded-lg transition-colors",
                        selectedUseCases.includes(useCase.id)
                          ? "border-black bg-black/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{useCase.label}</span>
                        {selectedUseCases.includes(useCase.id) && <Check className="h-4 w-4" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            {!success && (
              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isNextDisabled() || isLoading}
                  className="bg-[#d8f950] text-black hover:bg-[#c2e340]"
                >
                  {isLoading ? (
                    "Creating account..."
                  ) : step === 3 ? (
                    "Create account"
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* If email verification is needed, show login link */}
            {success && (
              <div className="mt-6 text-center">
                <p className="mb-4 text-sm text-gray-600">
                  Already verified your email?
                </p>
                <Button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="bg-[#d8f950] text-black hover:bg-[#c2e340]"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
