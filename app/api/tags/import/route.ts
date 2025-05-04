import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * NOTE: Excel format support is currently disabled.
 * Please convert Excel files to CSV format before uploading.
 */

export async function POST(req: Request) {
  try {
    // Initialize Supabase clients
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    
    // Get the form data with the file
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Check file type
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    const isCsv = file.name.endsWith('.csv')
    
    if (!isExcel && !isCsv) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    if (isExcel) {
      return NextResponse.json({
        error: 'Excel format is currently not supported',
        message: 'Please convert your Excel file to CSV format and try again.',
        help: 'You can use the template download feature to get a CSV template.'
      }, { status: 400 })
    }
    
    let rawData: any[] = []
    
    // Process CSV file
    const fileData = await file.text()
    
    // Split by lines and get the headers from the first line
    const lines = fileData.split('\n')
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }
    
    // Parse header line
    const headers = lines[0].split(',').map(h => h.trim())
    
    // Check for required tag_name column
    const tagNameIndex = headers.findIndex(h => 
      h.toLowerCase() === 'tag_name' || h.toLowerCase() === 'tag name'
    )
    
    if (tagNameIndex === -1) {
      return NextResponse.json({ 
        error: 'CSV file must contain a "tag_name" or "Tag Name" column' 
      }, { status: 400 })
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      const values = line.split(',').map(v => v.trim())
      
      // Only get the tag name, ignore any is_default field
      const tagName = values[tagNameIndex] || ''
      if (tagName) {
        rawData.push({ 
          tag_name: tagName 
        })
      }
    }
    
    // Validate and extract tags
    const tags: { tag_name: string; is_default: boolean }[] = []
    const errors: string[] = []
    
    for (let i = 0; i < rawData.length; i++) {
      const rowObj = rawData[i]
      const rowIndex = i + 2 // File is 1-indexed and we skip the header
      
      // Get the tag name
      const tagName = (rowObj.tag_name || '').trim()
      
      // Validate tag name
      if (!tagName) {
        errors.push(`Row ${rowIndex}: Tag name cannot be empty`)
        continue
      }
      
      if (tagName.length > 30) {
        errors.push(`Row ${rowIndex}: Tag name "${tagName}" exceeds 30 characters`)
        continue
      }
      
      // Check for duplicate tags in our processed list
      if (tags.some(t => t.tag_name.toLowerCase() === tagName.toLowerCase())) {
        errors.push(`Row ${rowIndex}: Duplicate tag "${tagName}" in import file`)
        continue
      }
      
      // Add to our tags list - always set is_default to false
      tags.push({
        tag_name: tagName,
        is_default: false
      })
    }
    
    // If no valid tags were found
    if (tags.length === 0) {
      return NextResponse.json({ 
        error: 'No valid tags found in the file',
        details: errors.length > 0 ? errors : undefined
      }, { status: 400 })
    }
    
    // Get existing tags for this user
    const { data: existingTags, error: fetchError } = await supabase
      .from('user_tags')
      .select('tag_name')
      .eq('user_id', userId)
    
    if (fetchError) {
      console.error('Error fetching existing tags:', fetchError)
      return NextResponse.json({ 
        error: 'Error fetching existing tags',
        details: fetchError.message
      }, { status: 500 })
    }
    
    // Filter out tags that already exist
    const existingTagNames = new Set(existingTags?.map(t => t.tag_name.toLowerCase()) || [])
    const newTags = tags.filter(t => !existingTagNames.has(t.tag_name.toLowerCase()))
    const skippedTags = tags.filter(t => existingTagNames.has(t.tag_name.toLowerCase()))
    
    // If all tags already exist
    if (newTags.length === 0) {
      return NextResponse.json({ 
        success: false,
        message: 'All tags in the file already exist in your account',
        importedCount: 0,
        skippedCount: skippedTags.length,
        errors
      })
    }
    
    // Insert new tags - ensure is_default is always false
    const tagsToInsert = newTags.map(tag => ({
      user_id: userId,
      tag_name: tag.tag_name,
      is_default: false // Always false regardless of what was in the file
    }))
    
    const { data: insertedTags, error: insertError } = await supabase
      .from('user_tags')
      .insert(tagsToInsert)
      .select()
    
    if (insertError) {
      console.error('Error inserting tags:', insertError)
      return NextResponse.json({ 
        error: 'Error inserting tags',
        details: insertError.message
      }, { status: 500 })
    }
    
    // Return success with counts
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${newTags.length} tags`,
      importedCount: newTags.length,
      skippedCount: skippedTags.length,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error: any) {
    console.error('Error importing tags:', error)
    return NextResponse.json({
      error: 'Error processing tag import',
      details: error.message
    }, { status: 500 })
  }
} 