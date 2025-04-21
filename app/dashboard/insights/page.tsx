"use client"

import { useState, useEffect } from "react"
import { Loader2, TrendingUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Insight {
  title: string;
  description: string;
  tags: string[];
  count: number;
  trend: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        // Mock insights data for now
        // In the future, this will come from an API endpoint
        setInsights([
          {
            title: "Increasing Login Issues",
            description: "There's been a 25% increase in authentication-related tickets over the past week, primarily concerning password resets and account access.",
            tags: ["authentication", "login", "password-reset"],
            count: 15,
            trend: "+25%"
          },
          {
            title: "Feature Request Pattern",
            description: "Multiple users have requested integration with popular calendar apps. This represents a growing need for better scheduling features.",
            tags: ["feature-request", "calendar", "integration"],
            count: 8,
            trend: "+15%"
          },
          {
            title: "Billing Confusion",
            description: "Several customers have reported confusion about the new pricing structure. Consider reviewing the pricing page clarity.",
            tags: ["billing", "pricing", "customer-feedback"],
            count: 12,
            trend: "+10%"
          }
        ])
      } catch (err: any) {
        console.error('Error fetching insights:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Insights</h1>
      <p className="text-gray-600 mb-6">
        AI-generated analysis and trends from your support tickets.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">{insight.title}</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                insight.trend.startsWith("+") ? "bg-green-100 text-green-800" : 
                insight.trend.startsWith("-") ? "bg-red-100 text-red-800" : 
                "bg-gray-100 text-gray-800"
              }`}>
                <span className="flex items-center gap-1">
                  {insight.trend.startsWith("+") && <TrendingUp className="h-3 w-3" />}
                  {insight.trend}
                </span>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{insight.description}</p>

            <div className="flex justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                {insight.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 rounded-full text-xs bg-accent text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MessageSquare className="h-4 w-4" />
                <span>{insight.count} tickets</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                View related tickets
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-accent p-6 rounded-xl border">
        <h2 className="font-bold mb-2">About AI-powered insights</h2>
        <p className="text-gray-700">
          These insights are generated using advanced AI analysis of your support tickets.
          Trends are calculated based on ticket volume changes over time.
        </p>
      </div>
    </div>
  )
} 