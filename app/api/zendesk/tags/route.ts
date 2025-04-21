import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Since tag analysis is not needed right now, just return empty data
    console.log("Tags API called - returning empty data as requested")
    
    return NextResponse.json({ 
      tags: [],
      categories: {},
      message: "Tag analysis is disabled for now" 
    })
  } catch (error: any) {
    console.error('Error in tags endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 