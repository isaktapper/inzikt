import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get request body
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }
    
    console.log(`Generating tags for domain: ${domain}`);
    
    // In a real implementation, you would:
    // 1. Scrape the website content
    // 2. Use AI to generate relevant tags
    // 3. Insert the tags into the database
    
    // For now, we'll generate some sample tags based on common domains
    const sampleTags = [
      { tag_name: 'Customer Support', is_default: true },
      { tag_name: 'Technical Issues', is_default: false },
      { tag_name: 'Feature Requests', is_default: false },
      { tag_name: 'Billing', is_default: false },
      { tag_name: 'Account Management', is_default: false }
    ];
    
    // Add domain-specific tags
    if (domain.includes('ecommerce') || domain.includes('shop')) {
      sampleTags.push(
        { tag_name: 'Orders', is_default: false },
        { tag_name: 'Shipping', is_default: false },
        { tag_name: 'Returns', is_default: false }
      );
    } else if (domain.includes('saas') || domain.includes('software')) {
      sampleTags.push(
        { tag_name: 'Onboarding', is_default: false },
        { tag_name: 'API', is_default: false },
        { tag_name: 'Integration', is_default: false }
      );
    } else if (domain.includes('finance') || domain.includes('bank')) {
      sampleTags.push(
        { tag_name: 'Payments', is_default: false },
        { tag_name: 'Security', is_default: false },
        { tag_name: 'Transactions', is_default: false }
      );
    }
    
    // Insert tags into the database
    const tagsToInsert = sampleTags.map(tag => ({
      user_id: userId,
      tag_name: tag.tag_name,
      is_default: tag.is_default
    }));
    
    // Check for existing tags to avoid duplicates
    const { data: existingTags } = await supabase
      .from('user_tags')
      .select('tag_name')
      .eq('user_id', userId);
    
    const existingTagNames = new Set((existingTags || []).map(t => t.tag_name.toLowerCase()));
    const newTags = tagsToInsert.filter(tag => !existingTagNames.has(tag.tag_name.toLowerCase()));
    
    if (newTags.length === 0) {
      return NextResponse.json({
        message: 'All suggested tags already exist in your account',
        count: 0
      });
    }
    
    // Insert new tags
    const { data, error } = await supabase
      .from('user_tags')
      .insert(newTags)
      .select();
    
    if (error) {
      console.error('Error inserting tags:', error);
      return NextResponse.json(
        { error: 'Failed to create tags' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${newTags.length} tags from your website`,
      count: newTags.length,
      tags: data
    });
    
  } catch (error: any) {
    console.error('Error generating tags:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags', details: error.message },
      { status: 500 }
    );
  }
} 