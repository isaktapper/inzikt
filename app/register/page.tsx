"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/utils/supabase/client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    role: "",
    ticketsPerMonth: "",
    mainGoal: "",
    heardFrom: ""
  })
  
  // List of potential use cases from which users can select
  const useCases = [
    { id: "reduce_support_volume", label: "Reduce support volume" },
    { id: "improve_product", label: "Improve product based on feedback" },
    { id: "understand_customers", label: "Better understand customers" },
    { id: "identify_trends", label: "Identify support trends" },
    { id: "prioritize_issues", label: "Prioritize which issues to fix" },
    { id: "increase_csat", label: "Increase customer satisfaction" }
  ]

  // Main goals options
  const mainGoals = [
    { id: "automate_tagging", label: "Automate tagging and categorization" },
    { id: "get_customer_insights", label: "Get insights from customer feedback" },
    { id: "improve_support_efficiency", label: "Improve support team efficiency" },
    { id: "track_product_issues", label: "Track product issues and bugs" },
    { id: "understand_customer_needs", label: "Better understand customer needs" }
  ]

  // How did you hear about us options
  const referralSources = [
    { id: "producthunt", label: "ProductHunt" },
    { id: "twitter", label: "Twitter" },
    { id: "referral", label: "Referral" },
    { id: "other", label: "Other" }
  ]
  
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [supabase] = useState(() => createClientSupabaseClient())
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly')

  useEffect(() => {
    // Check for plan and period in URL parameters
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan')
    const period = params.get('period')
    
    if (plan) {
      setSelectedPlan(plan)
      console.log('Found plan in URL:', plan)
      
      // Store in sessionStorage for later use
      try {
        sessionStorage.setItem('selectedPlan', plan)
        console.log('Stored plan in sessionStorage')
      } catch (error) {
        console.error('Error storing plan in sessionStorage:', error)
      }
    }

    if (period) {
      setSelectedPeriod(period)
      console.log('Found period in URL:', period)
      
      // Store in sessionStorage for later use
      try {
        sessionStorage.setItem('selectedPeriod', period)
        console.log('Stored period in sessionStorage')
      } catch (error) {
        console.error('Error storing period in sessionStorage:', error)
      }
    }
  }, [])

  const updateFormData = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const toggleUseCase = (id: string) => {
    if (selectedUseCases.includes(id)) {
      setSelectedUseCases(selectedUseCases.filter(item => item !== id))
    } else {
      setSelectedUseCases([...selectedUseCases, id])
    }
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
              email: formData.email,
              full_name: formData.name,
              company: formData.company,
              role: formData.role,
              use_cases: selectedUseCases,
              usage_this_month: 0,
              tickets_per_month: formData.ticketsPerMonth,
              main_goal: formData.mainGoal,
              heard_from: formData.heardFrom,
              plan_active: false,
              // Store the selected plan and period in the profile for backup
              selected_plan: selectedPlan,
              selected_period: selectedPeriod
            })

          if (profileError) {
            console.error("Profile creation error:", profileError)
            // Don't throw here - we want to still show the email verification message
          }

          // Store selected plan (if any) in session storage for after verification
          if (selectedPlan) {
            try {
              sessionStorage.setItem('selectedPlan', selectedPlan)
              sessionStorage.setItem('selectedPeriod', selectedPeriod)
              console.log("Stored selected plan in sessionStorage:", selectedPlan, "with period:", selectedPeriod)
            } catch (storageError) {
              console.error("Error storing plan in sessionStorage:", storageError)
            }
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
      if (error.message?.includes("already registered")) {
        setError("This email is already registered. Please sign in or use a different email.")
      } else {
        setError(error.message || "Failed to create account")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    if (step < 4) {
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
      return !formData.company || !formData.role || !formData.ticketsPerMonth
    }
    if (step === 3) {
      return !formData.mainGoal
    }
    if (step === 4) {
      return !formData.heardFrom
    }
    return false
  }

  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-300">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300",
                      step === i
                        ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white"
                        : step > i
                          ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white"
                          : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {step > i ? <Check className="h-4 w-4" /> : i}
                  </div>
                ))}
              </div>
              <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-500 text-center">Step {step} of 4</div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 text-red-800">
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
                  <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">Create your account</h1>
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
                      className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
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
                      className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company & Role */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">Tell us about yourself</h1>
                  <p className="text-gray-600">Help us tailor your experience</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="Your company"
                      value={formData.company}
                      onChange={(e) => updateFormData("company", e.target.value)}
                      className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => updateFormData("role", value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="founder">Founder / CEO</SelectItem>
                        <SelectItem value="product">Product Manager</SelectItem>
                        <SelectItem value="support">Support Lead</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticketsPerMonth">How many tickets do you process per month?</Label>
                    <Select 
                      value={formData.ticketsPerMonth} 
                      onValueChange={(value) => updateFormData("ticketsPerMonth", value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50">
                        <SelectValue placeholder="Select ticket volume" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<500">Less than 500</SelectItem>
                        <SelectItem value="500-2000">500 - 2,000</SelectItem>
                        <SelectItem value="2000-5000">2,000 - 5,000</SelectItem>
                        <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                        <SelectItem value=">10000">More than 10,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Main Goal */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">What is your main goal with Inzikt?</h1>
                  <p className="text-gray-600">Help us understand how we can best assist you</p>
                </div>

                <div className="space-y-4">
                  <RadioGroup 
                    value={formData.mainGoal}
                    onValueChange={(value) => updateFormData("mainGoal", value)}
                    className="space-y-3"
                  >
                    {mainGoals.map((goal) => (
                      <div 
                        key={goal.id}
                        className="flex items-center space-x-3 border rounded-lg p-3 hover:border-orange-300 transition-colors"
                        onClick={() => updateFormData("mainGoal", goal.id)}
                      >
                        <RadioGroupItem value={goal.id} id={`goal-${goal.id}`} className="flex-shrink-0" />
                        <Label 
                          htmlFor={`goal-${goal.id}`} 
                          className="w-full cursor-pointer"
                        >
                          {goal.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 4: How did you hear about us */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">How did you hear about us?</h1>
                  <p className="text-gray-600">We're curious to know where you found us</p>
                </div>

                <div className="space-y-4">
                  <RadioGroup
                    value={formData.heardFrom}
                    onValueChange={(value) => updateFormData("heardFrom", value)}
                    className="space-y-3"
                  >
                    {referralSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center space-x-3 border rounded-lg p-3 hover:border-orange-300 transition-colors"
                        onClick={() => updateFormData("heardFrom", source.id)}
                      >
                        <RadioGroupItem value={source.id} id={`source-${source.id}`} className="flex-shrink-0" />
                        <Label
                          htmlFor={`source-${source.id}`}
                          className="w-full cursor-pointer"
                        >
                          {source.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Success message when email verification is needed */}
            {success ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      // Simply refreshes the page to start again - most common action
                      window.location.reload()
                    }}
                    className="mt-4"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <div className={step === 1 ? "w-full" : ""}>
                  <Button
                    onClick={nextStep}
                    disabled={isNextDisabled() || isLoading}
                    className={cn(
                      "flex items-center bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600",
                      step === 1 ? "w-full" : "ml-auto"
                    )}
                  >
                    {step === 4 ? (
                      isLoading ? "Creating Account..." : "Create Account"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
