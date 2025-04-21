import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Since insights generation is not needed yet, just return an empty array
    console.log("Insights API called - returning empty array as requested")
    
    return NextResponse.json({ 
      insights: [],
      message: "Insights are disabled for now" 
    })
  } catch (error: any) {
    console.error('Error in insights endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 