import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with service role for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define proper types for ticket and analysis data
interface TicketAnalysis {
  aiSummary?: string;
  aiDescription?: string;
  aiTags?: string[];
}

interface TicketWithAnalysis {
  id: string;
  subject: string;
  description: string;
  analysis?: TicketAnalysis;
}

interface TicketData {
  id: string;
  subject: string;
  summary: string;
  tags: string[];
}

interface Recommendation {
  title: string;
  description: string;
  type: string;
  tags: string[];
  confidence_score: number;
  related_tickets: string[];
  price?: string;
  url?: string;
}

export async function GET(req: Request) {
  try {
    // Get authorization token from header
    const token = req.headers.get('authorization')?.split(' ')[1] || '';
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort') || 'newest';
    
    // Build query
    let query = supabase
      .from('product_recommendations')
      .select('*')
      .eq('user_id', user.id);
    
    // Apply status filter if provided
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }
    
    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Execute query
    const { data: recommendations, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }
    
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Verify this is a server-to-server request with a valid key
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }
    
    // 1. Get analyzed tickets for this user
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        subject,
        description,
        analysis (
          aiSummary,
          aiDescription,
          aiTags
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Process the most recent 100 tickets
    
    if (ticketsError) {
      throw ticketsError;
    }
    
    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { message: 'No analyzed tickets found for this user' },
        { status: 200 }
      );
    }
    
    // Extract tickets with analysis
    const analyzedTickets = (tickets as TicketWithAnalysis[]).filter(ticket => 
      ticket.analysis && ticket.analysis.aiSummary
    );
    
    if (analyzedTickets.length === 0) {
      return NextResponse.json(
        { message: 'No analyzed tickets found for this user' },
        { status: 200 }
      );
    }
    
    // 2. Format tickets data for analysis
    const ticketsData: TicketData[] = analyzedTickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      summary: ticket.analysis?.aiSummary || '',
      tags: ticket.analysis?.aiTags || []
    }));
    
    // 3. Generate recommendations using OpenAI
    const prompt = `
      You are a product recommendation engine that analyzes customer support tickets to suggest product improvements.
      
      Based on the following tickets from our support system, generate 3-5 product recommendations.
      Focus on identifying patterns, frequent requests, pain points, or improvement opportunities.
      
      Tickets data:
      ${JSON.stringify(ticketsData, null, 2)}
      
      For each recommendation:
      1. Provide a clear, concise title
      2. Write a detailed description explaining the recommendation
      3. Classify it as one of: "feature", "improvement", "fix", "integration"
      4. Include relevant tags from the tickets
      5. Provide a confidence score (0.0-1.0) based on how strongly the tickets support this recommendation
      6. Include the IDs of tickets that support this recommendation
      7. If applicable, suggest a price range or estimate for implementation
      
      Format your response as a JSON object with an array of recommendations:
      {
        "recommendations": [
          {
            "title": "string",
            "description": "string",
            "type": "feature|improvement|fix|integration",
            "tags": ["string"],
            "confidence_score": number,
            "related_tickets": ["uuid"],
            "price": "string (optional)"
          }
        ]
      }
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates product recommendations based on ticket analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    
    const aiResponse = response.choices[0].message.content || '{"recommendations": []}';
    let recommendationsData;
    
    try {
      recommendationsData = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Invalid JSON response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to parse AI-generated recommendations' },
        { status: 500 }
      );
    }
    
    // 4. Store recommendations in database
    const recommendations = recommendationsData.recommendations || [] as Recommendation[];
    
    if (recommendations.length === 0) {
      return NextResponse.json(
        { message: 'No recommendations could be generated from the ticket data' },
        { status: 200 }
      );
    }
    
    // Insert each recommendation
    const inserts = recommendations.map((rec: Recommendation) => ({
      user_id: userId,
      title: rec.title,
      description: rec.description,
      type: rec.type,
      confidence_score: rec.confidence_score,
      related_tickets: rec.related_tickets || [],
      tags: rec.tags || [],
      status: 'pending',
      price: rec.price,
      url: rec.url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data: inserted, error: insertError } = await supabase
      .from('product_recommendations')
      .insert(inserts)
      .select();
    
    if (insertError) {
      throw insertError;
    }
    
    return NextResponse.json({
      message: `Successfully generated ${recommendations.length} product recommendations`,
      count: recommendations.length,
      recommendations: inserted
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // Get authorization token from header
    const token = req.headers.get('authorization')?.split(' ')[1] || '';
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { id, status } = body;
    
    if (!id || !status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Update the recommendation
    const { data, error: updateError } = await supabase
      .from('product_recommendations')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({
      message: `Recommendation status updated to ${status}`,
      recommendation: data
    });
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation status' },
      { status: 500 }
    );
  }
} 