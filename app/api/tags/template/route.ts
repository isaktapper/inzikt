import { NextResponse } from 'next/server'

/**
 * NOTE: Excel format support is currently disabled.
 * All template requests will return CSV format.
 */

export async function GET(req: Request) {
  try {
    // Check if format is specified in the query
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'csv'
    
    // Sample data - removed is_default field
    const sampleData = [
      { tag_name: 'Customer Support' },
      { tag_name: 'Technical Issues' },
      { tag_name: 'Billing' },
      { tag_name: 'Feature Request' }
    ]
    
    // Always return CSV format
    const csvContent = `tag_name
Customer Support
Technical Issues
Billing
Feature Request
`
    
    if (format === 'excel' || format === 'xlsx') {
      // Return CSV with a message about Excel format being unavailable
      return NextResponse.json({
        message: 'Excel format is currently unavailable. Please use CSV format instead.',
        fallback: 'csv',
        download_url: `${url.origin}/api/tags/template?format=csv`
      }, { status: 200 })
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="tag-import-template.csv"'
      }
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json({
      error: 'Error generating template',
      details: error.message
    }, { status: 500 })
  }
} 