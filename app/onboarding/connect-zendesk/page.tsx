"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Sample data for groups and statuses
const zendeskGroups = [
  { id: "support", name: "Support Team" },
  { id: "billing", name: "Billing Support" },
  { id: "technical", name: "Technical Support" },
  { id: "product", name: "Product Team" },
]

const ticketStatuses = [
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "solved", label: "Solved" },
  { id: "closed", label: "Closed" },
]

export default function ConnectZendeskPage() {
  const [step, setStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)

  const [formData, setFormData] = useState({
    subdomain: "",
    email: "",
    apiToken: "",
  })

  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["open", "pending"])

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleStatus = (id: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const connectZendesk = () => {
    setIsConnecting(true)
    setConnectionError(null)

    // Simulate API connection
    setTimeout(() => {
      setIsConnecting(false)

      // Simulate successful connection (in a real app, this would be an API call)
      if (formData.subdomain && formData.email && formData.apiToken) {
        setStep(2)
      } else {
        setConnectionError("Failed to connect. Please check your credentials.")
      }
    }, 1500)
  }

  const startImport = () => {
    setStep(3)

    // Simulate import progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setImportProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        // In a real app, you would redirect to the dashboard after import is complete
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
      }
    }, 500)
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isNextDisabled = () => {
    if (step === 1) {
      return !formData.subdomain || !formData.email || !formData.apiToken
    }
    if (step === 2) {
      return selectedGroups.length === 0 || selectedStatuses.length === 0
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

            {/* Step 1: Zendesk Credentials */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Connect Zendesk</h1>
                  <p className="text-gray-600">Enter your Zendesk credentials to import your support tickets</p>
                </div>

                {connectionError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Zendesk Subdomain</Label>
                    <div className="flex items-center">
                      <Input
                        id="subdomain"
                        placeholder="your-company"
                        value={formData.subdomain}
                        onChange={(e) => updateFormData("subdomain", e.target.value)}
                        className="rounded-r-none"
                      />
                      <div className="bg-gray-100 px-3 py-2 border border-l-0 rounded-r-md text-gray-500">
                        .zendesk.com
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Admin Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiToken">API Token</Label>
                    <Input
                      id="apiToken"
                      type="password"
                      placeholder="Enter your API token"
                      value={formData.apiToken}
                      onChange={(e) => updateFormData("apiToken", e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can find your API token in Zendesk Admin &gt; API settings
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Groups and Statuses */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Select Data to Import</h1>
                  <p className="text-gray-600">Choose which support groups and ticket statuses to analyze</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">Support Groups</Label>
                    <p className="text-xs text-gray-500 mb-2">Select one or more groups to import tickets from</p>
                    <div className="space-y-2">
                      {zendeskGroups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={() => toggleGroup(group.id)}
                          />
                          <Label htmlFor={`group-${group.id}`} className="text-sm font-normal cursor-pointer">
                            {group.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Ticket Statuses</Label>
                    <p className="text-xs text-gray-500 mb-2">Select which ticket statuses to include</p>
                    <div className="space-y-2">
                      {ticketStatuses.map((status) => (
                        <div key={status.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status.id}`}
                            checked={selectedStatuses.includes(status.id)}
                            onCheckedChange={() => toggleStatus(status.id)}
                          />
                          <Label htmlFor={`status-${status.id}`} className="text-sm font-normal cursor-pointer">
                            {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Import Progress */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 mb-6 bg-[#d8f950]/20 rounded-full flex items-center justify-center">
                    {importProgress < 100 ? (
                      <Loader2 className="h-8 w-8 text-black animate-spin" />
                    ) : (
                      <Check className="h-8 w-8 text-black" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    {importProgress < 100 ? "Importing Your Tickets" : "Import Complete!"}
                  </h1>
                  <p className="text-gray-600">
                    {importProgress < 100
                      ? "We're analyzing your support tickets. This may take a few minutes."
                      : "Your tickets have been imported and analyzed. Redirecting to dashboard..."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#d8f950] transition-all duration-300 ease-in-out"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            {step < 3 && (
              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div></div>
                )}
                {step === 1 ? (
                  <Button
                    type="button"
                    onClick={connectZendesk}
                    disabled={isNextDisabled() || isConnecting}
                    className="bg-[#d8f950] text-black hover:bg-[#c2e340] flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                      </>
                    ) : (
                      <>
                        Connect Zendesk <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : step === 2 ? (
                  <Button
                    type="button"
                    onClick={startImport}
                    disabled={isNextDisabled()}
                    className="bg-[#d8f950] text-black hover:bg-[#c2e340] flex items-center gap-2"
                  >
                    Start Import <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          {/* Help text */}
          {step < 3 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <Link href="#" className="text-black font-medium hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
