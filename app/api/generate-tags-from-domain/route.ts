import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';
// Use require() for cheerio to avoid ES module issues
const cheerio = require('cheerio');

// Simple domain content extractor function
async function extractDomainContent(domain: string): Promise<string> {
  // Make sure the domain doesn't have protocol
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  try {
    // First try HTTPS
    const url = `https://${cleanDomain}`;
    console.log(`Fetching content from ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove script, style elements
    $('script, style, svg, iframe').remove();
    
    // Get meta description
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Get page title
    const pageTitle = $('title').text() || '';
    
    // Extract text from important elements using a simpler approach to avoid type issues
    const headlines = $('h1, h2, h3').toArray().map((el: any) => $(el).text().trim()).join('\n');
    const paragraphs = $('p').toArray().map((el: any) => $(el).text().trim()).join('\n');
    const navItems = $('nav a, header a').toArray().map((el: any) => $(el).text().trim()).join(', ');
    
    // Combine all extracted content
    let combinedContent = [
      `Domain: ${domain}`,
      `Title: ${pageTitle}`,
      `Description: ${metaDescription}`,
      `Navigation: ${navItems}`,
      `Main Headlines:`,
      headlines,
      `Content:`,
      paragraphs
    ].filter(Boolean).join('\n\n');
    
    // Clean up the content
    combinedContent = combinedContent
      .replace(/\s+/g, ' ')               // Replace multiple spaces with single space
      .replace(/(\n\s*\n)+/g, '\n\n')     // Replace multiple newlines with double newline
      .trim();
    
    return combinedContent;
  } catch (error) {
    console.error(`Error with HTTPS, trying HTTP: ${error}`);
    
    try {
      // If HTTPS fails, try HTTP
      const url = `http://${cleanDomain}`;
      console.log(`Fetching content from ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Basic content extraction
      $('script, style').remove();
      return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (secondError) {
      console.error(`Failed to fetch content: ${secondError}`);
      return `Could not extract content from ${domain}`;
    }
  }
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface TagObject {
  tag_name: string;
  description?: string; // Optional since we don't store it in the database
}

export async function POST(req: Request) {
  try {
    // Get domain from request body
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get user from auth token
    const authHeader = req.headers.get('authorization')?.split(' ')[1] || '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for existing user tags
    const { data: existingTags, error: tagsError } = await supabase
      .from('user_tags')
      .select('tag_name')
      .eq('user_id', user.id);
      
    if (tagsError) {
      console.error('Error fetching existing user tags:', tagsError);
    }
    
    const existingTagNames = (existingTags || []).map(tag => tag.tag_name);
    const existingTagsPrompt = existingTagNames.length > 0 
      ? `The user already has these tags: ${existingTagNames.join(', ')}
         When possible, prioritize suggesting NEW tags that complement these existing ones rather than duplicating them.
         Your suggestions should fill gaps in the existing tags.`
      : '';
    
    // Step I: Extract content from the domain
    console.log(`Extracting content from domain: ${domain}`);
    let domainContent;
    try {
      domainContent = await extractDomainContent(domain);
    } catch (error) {
      console.error(`Error extracting domain content: ${error}`);
      domainContent = `Unable to extract content from ${domain}. Using domain name only for tag generation.`;
    }
    
    // Step II: Generate tags using OpenAI
    console.log(`Generating tags for domain: ${domain}`);
    const prompt = `
      Based on the following website content from ${domain}, generate a list of 10-15 specific tags that would be useful for categorizing customer support tickets.
      
      Each tag should:
      - Be 1-3 words long
      - Be specific enough to be useful (e.g., "password reset" is better than just "password")
      - Avoid generic words like "issue", "problem", or "question"
      - Not include the company name or domain name
      - Focus on products, features, actions, and common support topics
      
      ${existingTagsPrompt}
      
      ${domainContent}
      
      Format your response as a JSON object with an array of tag objects, each with a 'tag_name' property:
      {
        "tags": [
          { "tag_name": "tag1" },
          { "tag_name": "tag2" }
        ]
      }
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates categorization tags based on website content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    
    const content = response.choices[0].message.content || '';
    console.log('GPT Response:', content);
    
    // Parse the response
    let tags: TagObject[] = [];
    try {
      const jsonResponse = JSON.parse(content);
      tags = jsonResponse.tags || [];
      
      // Handle if response is directly an array
      if (!tags.length && Array.isArray(jsonResponse)) {
        tags = jsonResponse;
      }
      
      // Filter out duplicates of existing tags
      if (existingTagNames.length > 0) {
        const newTags = tags.filter(tagObj => 
          !existingTagNames.includes(tagObj.tag_name) && 
          !existingTagNames.map(name => name.toLowerCase()).includes(tagObj.tag_name.toLowerCase())
        );
        
        console.log(`Filtered out ${tags.length - newTags.length} duplicate tags`);
        tags = newTags;
      }
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      // Try to extract JSON array from the text if parsing fails
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          tags = JSON.parse(jsonMatch[0]);
        } catch (error) {
          console.error('Error parsing extracted JSON:', error);
          return NextResponse.json(
            { error: 'Failed to parse tag data' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to generate valid tags' },
          { status: 500 }
        );
      }
    }
    
    // Step III: Store tags in user_tags table
    console.log(`Storing ${tags.length} tags for user ${user.id}`);
    const insertPromises = tags.map((tagObj: TagObject) => {
      return supabase
        .from('user_tags')
        .upsert({
          user_id: user.id,
          tag_name: tagObj.tag_name,
          is_default: true
        }, {
          onConflict: 'user_id,tag_name',
          ignoreDuplicates: false
        });
    });
    
    await Promise.all(insertPromises);
    
    // Step IV: Update user profile with domain
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        domain
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating user profile:', updateError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${tags.length} tags for domain ${domain}`,
      tags
    });
    
  } catch (error: any) {
    console.error('Error in generate-tags-from-domain route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 