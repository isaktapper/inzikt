import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { format, subDays, subWeeks, subMonths, subQuarters, subYears, isAfter } from 'date-fns';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'half_year' | 'year';

interface GenerateInsightsParams {
  user_id: string;
  periods?: PeriodType[]; // Multiple periods
  period?: PeriodType; // Backward compatibility for single period
  compare_with?: 'previous_period' | 'same_last_year';
}

/**
 * Generate insights from analyzed tickets
 */
export async function generateInsights(params: GenerateInsightsParams): Promise<any> {
  console.log("--- GENERATE INSIGHTS FUNCTION CALLED ---");
  console.log("Parameters:", JSON.stringify(params));
  
  const { 
    user_id, 
    period = 'week',
    periods = period ? [period] : ['week'], // Use arrays of periods, defaulting to single period for backward compatibility
    compare_with = 'previous_period'
  } = params;

  try {
    console.log(`Generating insights for user ${user_id}, periods: ${periods.join(', ')}, comparison: ${compare_with}`);
    
    const results = [];
    // Process each period
    for (const currentPeriod of periods) {
      console.log(`Processing period: ${currentPeriod}`);
      const periodResult = await generateInsightsForPeriod(user_id, currentPeriod, compare_with);
      results.push({
        period: currentPeriod,
        ...periodResult
      });
    }
    
    // Return combined results
    return {
      success: true,
      results: results
    };
  } catch (error) {
    console.error("FATAL ERROR in generateInsights:", error);
    throw error;
  }
}

/**
 * Generate insights for a single period
 */
async function generateInsightsForPeriod(
  user_id: string, 
  period: PeriodType, 
  compare_with: 'previous_period' | 'same_last_year'
): Promise<any> {
  try {
    // Define time periods
    const now = new Date();
    let currentPeriodStart;
    
    // Determine the current period start based on selected time period
    switch(period) {
      case 'day':
        currentPeriodStart = subDays(now, 1);
        break;
      case 'week':
        currentPeriodStart = subWeeks(now, 1);
        break;
      case 'month':
        currentPeriodStart = subMonths(now, 1);
        break;
      case 'quarter':
        currentPeriodStart = subQuarters(now, 1);
        break;
      case 'half_year':
        currentPeriodStart = subMonths(now, 6);
        break;
      case 'year':
        currentPeriodStart = subYears(now, 1);
        break;
      default:
        currentPeriodStart = subWeeks(now, 1);
    }
    
    // Log time periods
    console.log(`Current period: ${format(currentPeriodStart, 'yyyy-MM-dd')} to ${format(now, 'yyyy-MM-dd')}`);
    
    // Check if Supabase client can be created
    console.log("Attempting to create Supabase client for insights generation");
    console.log("NEXT_PUBLIC_SUPABASE_URL defined:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY defined:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    let previousPeriodStart, previousPeriodEnd;
    
    if (compare_with === 'previous_period') {
      // Calculate previous equivalent period
      previousPeriodEnd = currentPeriodStart;
      
      // Determine the previous period based on selected time period
      switch(period) {
        case 'day':
          previousPeriodStart = subDays(previousPeriodEnd, 1);
          break;
        case 'week':
          previousPeriodStart = subWeeks(previousPeriodEnd, 1);
          break;
        case 'month':
          previousPeriodStart = subMonths(previousPeriodEnd, 1);
          break;
        case 'quarter':
          previousPeriodStart = subQuarters(previousPeriodEnd, 1);
          break;
        case 'half_year':
          previousPeriodStart = subMonths(previousPeriodEnd, 6);
          break;
        case 'year':
          previousPeriodStart = subYears(previousPeriodEnd, 1);
          break;
        default:
          previousPeriodStart = subWeeks(previousPeriodEnd, 1);
      }
    } else {
      // Same period last year
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
    }

    console.log(`Previous period: ${format(previousPeriodStart, 'yyyy-MM-dd')} to ${format(previousPeriodEnd, 'yyyy-MM-dd')}`);

    // Fetch all tickets with analysis for both periods
    const { data: allTickets, error: ticketsError } = await supabase
      .from('tickets_with_analysis')
      .select('*')
      .eq('user_id', user_id);

    if (ticketsError) {
      throw new Error(`Failed to fetch tickets for insights: ${ticketsError.message}`);
    }

    if (!allTickets || allTickets.length === 0) {
      console.log(`No tickets found for user ${user_id}`);
      return { message: 'No tickets available for insights generation', insights: [] };
    }

    // Sort tickets into current and previous periods
    const currentPeriodTickets = allTickets.filter(ticket => {
      const ticketDate = new Date(ticket.zendesk_created_at || ticket.created_at);
      return isAfter(ticketDate, currentPeriodStart) && isAfter(now, ticketDate);
    });

    const previousPeriodTickets = allTickets.filter(ticket => {
      const ticketDate = new Date(ticket.zendesk_created_at || ticket.created_at);
      return isAfter(ticketDate, previousPeriodStart) && isAfter(previousPeriodEnd, ticketDate);
    });

    console.log(`Current period tickets: ${currentPeriodTickets.length}`);
    console.log(`Previous period tickets: ${previousPeriodTickets.length}`);

    // Skip if not enough data
    if (currentPeriodTickets.length === 0) {
      console.log(`No tickets for current period`);
      return { message: 'No tickets in current period for insights generation', insights: [] };
    }

    // Precompute metrics
    const metrics = computeMetrics(currentPeriodTickets, previousPeriodTickets);

    // Generate insights using OpenAI
    const insights = await generateAIInsights(
      user_id,
      metrics,
      currentPeriodTickets, 
      previousPeriodTickets,
      period,
      compare_with
    );

    return { success: true, insights };
  } catch (error) {
    console.error(`Error generating insights for period ${period}:`, error);
    return { error: String(error), insights: [] };
  }
}

/**
 * Compute metrics from tickets for insights generation
 */
function computeMetrics(currentTickets: any[], previousTickets: any[]): any {
  // Volume metrics
  const currentCount = currentTickets.length;
  const previousCount = previousTickets.length;
  const volumeChange = previousCount > 0 
    ? ((currentCount - previousCount) / previousCount) * 100 
    : null;

  // Tag frequency metrics
  const currentTagCount: Record<string, number> = {};
  const previousTagCount: Record<string, number> = {};
  const tagChanges: Record<string, number> = {};

  // Count tags in current period
  currentTickets.forEach(ticket => {
    const tags = ticket.ai_tags || [];
    tags.forEach((tag: string) => {
      currentTagCount[tag] = (currentTagCount[tag] || 0) + 1;
    });
  });

  // Count tags in previous period
  previousTickets.forEach(ticket => {
    const tags = ticket.ai_tags || [];
    tags.forEach((tag: string) => {
      previousTagCount[tag] = (previousTagCount[tag] || 0) + 1;
    });
  });

  // Calculate tag changes
  Object.keys(currentTagCount).forEach(tag => {
    const current = currentTagCount[tag];
    const previous = previousTagCount[tag] || 0;
    tagChanges[tag] = previous > 0 
      ? ((current - previous) / previous) * 100 
      : 100; // New tag
  });

  // Get top tags by frequency
  const topCurrentTags = Object.entries(currentTagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Identify emerging and declining topics
  const emergingTopics = Object.entries(tagChanges)
    .filter(([, change]) => change > 50)
    .map(([tag]) => tag);

  const decliningTopics = Object.entries(tagChanges)
    .filter(([, change]) => change < -50)
    .map(([tag]) => tag);

  // Sentiment analysis
  const currentSentiment = currentTickets.reduce((sum, t) => sum + (t.sentiment || 0), 0) / currentCount;
  const previousSentiment = previousTickets.reduce((sum, t) => sum + (t.sentiment || 0), 0) / previousCount;
  const sentimentChange = previousSentiment !== 0 
    ? ((currentSentiment - previousSentiment) / Math.abs(previousSentiment)) * 100 
    : null;

  // Urgency metrics
  const currentUrgency = currentTickets.reduce((sum, t) => sum + (t.urgency_score || 0), 0) / currentCount;
  const previousUrgency = previousTickets.reduce((sum, t) => sum + (t.urgency_score || 0), 0) / previousCount;
  const urgencyChange = previousUrgency !== 0 
    ? ((currentUrgency - previousUrgency) / Math.abs(previousUrgency)) * 100 
    : null;

  return {
    volumeChange: {
      currentCount,
      previousCount,
      percentageChange: volumeChange
    },
    topCurrentTags,
    tagChanges,
    emergingTopics,
    decliningTopics,
  };
}

/**
 * Generate insights using OpenAI
 */
async function generateAIInsights(
  userId: string,
  metrics: any,
  currentTickets: any[],
  previousTickets: any[],
  period: string,
  compareWith: string
): Promise<any[]> {
  try {
    // Prepare all tickets with summaries and tags for context
    // We're including all tickets instead of just a sample
    const ticketData = currentTickets.map(t => ({
      summary: t.ai_summary || 'No summary',
      tags: t.ai_tags || []
    }));

    // Create data structure for OpenAI prompt
    const data = {
      period,
      comparison: compareWith === 'previous_period' ? 'Previous equivalent period' : 'Same period last year',
      ticketVolume: {
        current: metrics.volumeChange.currentCount,
        previous: metrics.volumeChange.previousCount,
        percentageChange: metrics.volumeChange.percentageChange !== null 
          ? Number(metrics.volumeChange.percentageChange.toFixed(1)) 
          : null
      },
      topTags: metrics.topCurrentTags.map((t: any) => t.tag),
      significantChanges: metrics.tagChanges ? 
        Object.entries(metrics.tagChanges)
          .filter(([_, change]) => Math.abs(Number(change)) > 20)
          .map(([tag, change]) => ({ tag, change: Number(Number(change).toFixed(1)) }))
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .slice(0, 15) // Include more significant changes
        : [],
      emergingTopics: metrics.emergingTopics || [],
      decliningTopics: metrics.decliningTopics || [],
      tickets: ticketData
    };

    // Create detailed prompt for OpenAI
    const prompt = `
You are an AI insights engine analyzing customer support data.

You will receive a list of support ticket summaries and tags. Each entry includes:
- Summary: a short 1-line AI-generated summary of the ticket
- Tags: a list of AI-generated topic tags related to the issue

Your task:
1. Analyze trends, patterns, increases, decreases, and emerging themes in the data.
2. Focus on frequency shifts, ticket volume, and tag usage.
3. Generate 5–10 insights based only on the data provided.
4. Do NOT suggest actions. Only describe what the data shows.
5. Output raw JSON – no formatting, no code blocks, no markdown.

Each insight must follow this structure:
{
  "title": "Short, specific title with percentage or trend if relevant",
  "description": "2–3 sentences explaining the pattern, trend or anomaly",
  "insight_type": "TREND | VOLUME | EMERGING | DECLINE | ALERT | OTHER",
  "related_tags": ["tag1", "tag2"],
  "percentage_change": number or null,
  "metric_type": "volume | tag_frequency",
  "metric_value": number or null
}

Here's the dataset:
${JSON.stringify(data)}
`;

    console.log(`Sending prompt with ${data.tickets.length} tickets to OpenAI`);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an analytics expert that generates insights from customer support data. Output ONLY a valid JSON array with 5-10 insights. No markdown formatting, no code blocks, no introductions - just the raw JSON array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4, // Slightly lower temperature for more consistent outputs
    });

    // Get the response content and clean it before parsing
    let responseContent = response.choices[0].message.content || '[]';
    
    // Aggressive cleaning of markdown and other non-JSON formatting
    responseContent = responseContent
      .replace(/^```json\s*/g, '')   // Remove opening ```json
      .replace(/^```\s*/g, '')       // Remove opening ```
      .replace(/\s*```$/g, '')       // Remove closing ```
      .replace(/^\s*\[\s*\n/g, '[')  // Clean up array start
      .replace(/\s*\]\s*$/g, ']')    // Clean up array end
      .trim();
    
    console.log("Cleaned response content (first 100 chars):", responseContent.substring(0, 100) + "...");
    
    // Try to parse the JSON with multiple fallback methods
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log("Successfully parsed JSON response directly");
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.log("Response that failed to parse (first 200 chars):", responseContent.substring(0, 200));
      
      // First fallback: try to extract JSON array using regex
      try {
        const jsonMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted and parsed JSON array with regex");
        } else {
          throw new Error("No JSON array pattern found");
        }
      } catch (regexError) {
        console.error("Regex extraction failed:", regexError);
        
        // Second fallback: Try to fix common JSON syntax errors
        try {
          // Replace single quotes with double quotes
          let fixedJson = responseContent.replace(/'/g, '"');
          // Ensure property names are quoted
          fixedJson = fixedJson.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
          
          parsedResponse = JSON.parse(fixedJson);
          console.log("Successfully parsed JSON after syntax fixing");
        } catch (fixError) {
          console.error("All parsing attempts failed:", fixError);
          // Default empty array if all parsing attempts fail
          parsedResponse = [];
        }
      }
    }
    
    // Ensure we have an array of insights
    const insights = Array.isArray(parsedResponse) ? parsedResponse : [];

    console.log(`Generated ${insights.length} insights for period ${period}`);

    // Store insights in the database
    for (const insight of insights) {
      // Format to match our insights table
      const formattedInsight = {
        user_id: userId,
        title: insight.title || "Untitled insight",
        description: insight.description || "",
        insight_type: insight.insight_type || "OTHER",
        time_period: period,
        previous_period: compareWith,
        percentage_change: insight.percentage_change,
        related_tags: insight.related_tags || [],
        metric_type: insight.metric_type || "tag_frequency",
        metric_value: insight.metric_value,
        related_ticket_ids: getRelatedTicketIds(currentTickets, insight.related_tags),
        ai_generated: true,
        created_at: new Date().toISOString()
      };

      // Insert into insights table
      const { error: insertError } = await supabase
        .from('insights')
        .insert(formattedInsight);

      if (insertError) {
        console.error(`Error storing insight: ${insertError.message}`);
      }
    }

    return insights;
  } catch (error) {
    console.error('Error generating insights with OpenAI:', error);
    throw error;
  }
}

/**
 * Find ticket IDs related to specific tags
 */
function getRelatedTicketIds(tickets: any[], tags?: string[]) {
  if (!tags || tags.length === 0) return [];
  
  const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
  
  return tickets
    .filter(ticket => {
      const ticketTags = Array.isArray(ticket.ai_tags) 
        ? ticket.ai_tags.map((t: string) => t?.toLowerCase()?.trim() || '')
        : [];
      return normalizedTags.some(tag => ticketTags.includes(tag));
    })
    .map(ticket => ticket.id)
    .slice(0, 10); // Limit to 10 related tickets
} 