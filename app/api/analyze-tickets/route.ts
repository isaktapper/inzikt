import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Helper function to validate UUID
const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str);

// In-memory store for analysis progress
// This is a simple solution that works within a single Node.js instance
// For a production app with multiple instances, you'd use Redis or a database
interface AnalysisProgress {
  userId: string;
  totalTickets: number;
  processedCount: number;
  isCompleted: boolean;
  lastUpdateTime: number;
}

// Global variable to store progress
export const progressStore: Record<string, AnalysisProgress> = {};

// Helper function to update progress
const updateAnalysisProgress = (userId: string, totalTickets: number, processedCount: number, isCompleted: boolean = false) => {
  // Update progress directly in memory
  progressStore[userId] = {
    userId,
    totalTickets,
    processedCount,
    isCompleted,
    lastUpdateTime: Date.now()
  };
  
  // If WebSocket module is available, broadcast the progress
  try {
    // Dynamic import to avoid circular dependencies
    import('../ws/route').then(wsModule => {
      const { broadcastAnalysisProgress } = wsModule;
      if (broadcastAnalysisProgress) {
        broadcastAnalysisProgress(userId, progressStore[userId]);
      }
    }).catch(err => {
      console.error('Failed to import WebSocket module:', err);
    });
  } catch (error) {
    // If WebSocket module is not available, just log and continue
    console.error('Error broadcasting analysis progress:', error);
  }
  
  console.log(`Progress updated: ${processedCount}/${totalTickets} for user ${userId}`);
};

export async function POST(req: Request) {
  try {
    console.log('Starting ticket analysis...');
    
    // Extract user ID from request
    let userId = 'system';
    try {
      const body = await req.json();
      if (body && body.userId) {
        userId = body.userId;
        console.log(`Analysis requested for user ID: ${userId}`);
      } else {
        console.log('No user ID provided in request, using "system"');
      }
    } catch (error) {
      console.log('Could not parse request body, using default userId "system"');
    }
    
    // Use service role for unrestricted database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 1. Get all analyzed ticket IDs first
    const { data: analyzedTickets, error: analyzedError } = await supabase
      .from('analysis')
      .select('ticket_id');
    
    if (analyzedError) {
      console.error('Error fetching analyzed tickets:', analyzedError);
      return NextResponse.json(
        { error: 'Failed to fetch analyzed tickets' },
        { status: 500 }
      );
    }

    console.log(`Found ${analyzedTickets?.length || 0} already analyzed tickets`);
    
    // Filter out invalid UUIDs to avoid errors
    const analyzedIds = (analyzedTickets ?? [])
      .map(t => t.ticket_id)
      .filter(id => typeof id === 'string' && isUuid(id));
    
    console.log(`Valid analyzed ticket IDs: ${analyzedIds.length}`);

    // 2. Fetch tickets that don't have a corresponding row in the analysis table
    let ticketsQuery = supabase
      .from('tickets')
      .select('id, subject, description, conversation, user_id')
      .eq('user_id', userId); // Only get tickets for the current user
    
    // Only apply the filter if we have analyzed tickets
    if (analyzedIds.length > 0) {
      ticketsQuery = ticketsQuery.not('id', 'in', `(${analyzedIds.join(',')})`);
      console.log('Excluding analyzed tickets with IDs:', analyzedIds);
    }
    
    // Get all unanalyzed tickets
    const { data: tickets, error: ticketsError } = await ticketsQuery;
    
    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch tickets for analysis' },
        { status: 500 }
      );
    }

    // Log total tickets found with user info
    console.log(`Total tickets in database for user ${userId}: ${tickets?.length || 0}`);
    console.log('Ticket IDs to analyze:', tickets?.map(t => t.id));

    if (!tickets || tickets.length === 0) {
      // Initialize with completed state for progress tracking
      await updateAnalysisProgress(userId, 0, 0, true);
      
      return NextResponse.json({ 
        success: true, 
        message: 'No new tickets to analyze',
        count: 0
      });
    }
    
    console.log(`Found ${tickets.length} tickets to analyze`);
    
    // Track total tickets for progress
    const totalTickets = tickets.length;
    let processedCount = 0;
    
    // Initialize progress tracking
    await updateAnalysisProgress(userId, totalTickets, processedCount);
    
    // 2. Process each ticket with OpenAI
    const results = [];
    for (const ticket of tickets) {
      try {
        processedCount++;
        console.log(`Processing ticket ${processedCount}/${totalTickets}`);
        
        // Update progress after each ticket
        await updateAnalysisProgress(userId, totalTickets, processedCount);
        
        // Fetch allowed tags for this user from user_tags table
        const { data: userTags, error: tagsError } = await supabase
          .from('user_tags')
          .select('tag_name')
          .eq('user_id', ticket.user_id);
          
        if (tagsError) {
          console.error(`Error fetching user tags for user ${ticket.user_id}:`, tagsError);
        }
        
        // Extract tag names into an array
        const allowedTags = userTags?.map(tag => tag.tag_name) || [];
        console.log(`Found ${allowedTags.length} allowed tags for user ${ticket.user_id}`);
        
        // Prepare ticket conversation for analysis
        let conversationText = '';
        if (ticket.conversation && Array.isArray(ticket.conversation) && ticket.conversation.length > 0) {
          conversationText = ticket.conversation
            .map((msg: any) => `${msg.author_id ? (msg.author_id === 'customer' ? 'Customer' : 'Agent') : 'Unknown'}: ${msg.body}`)
            .join('\n\n');
        } else {
          // Use subject and description if no conversation
          conversationText = `Subject: ${ticket.subject}\n\nDescription: ${ticket.description || 'No description provided'}`;
        }
        
        // Build the prompt with the allowed tags
        let tagsPrompt = '';
        if (allowedTags.length > 0) {
          tagsPrompt = `
           IMPORTANT: You MUST choose from these allowed tags: ${allowedTags.join(', ')}
           
           Only suggest a new tag (i.e., one not in the above list) if there is ABSOLUTELY NO suitable tag in the provided list.
           If you must suggest a new tag, set "New tag: true" in your response and limit to a maximum of 1 new tag.
           In most cases, you should be able to find suitable existing tags, so please make every effort to use them rather than suggesting new ones.
           If you can find any relevant match, even if it's not perfect, use the existing tag instead of suggesting a new one.
           `;
        } else {
          tagsPrompt = `
           You are free to suggest 1-2 relevant topic tags that best categorize this ticket.
           Add a 3rd tag only if absolutely necessary.
           `;
        }
        
        // Send to OpenAI with updated prompt
        const prompt = `
           You are analyzing customer support tickets. For the ticket below, generate the following:

           1. A short, clear summary (1 sentence)  
           2. A detailed description (2–4 sentences) summarizing the request, problem, or situation  
           3. 1–2 relevant topic tags that accurately categorize this ticket. Add a 3rd tag only if absolutely necessary.

           ${tagsPrompt}

           Do NOT include company names, personal names, or locations in tags.

           --- FORMAT YOUR RESPONSE LIKE THIS ---

           Summary: [short summary]  
           Description: [detailed description]  
           Tags: [tag1], [tag2]  
           New tag: false
        `;
        
        const startTime = Date.now();
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt + '\n\n' + conversationText
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        const content = response.choices[0].message.content || '';
        console.log('GPT Response:', content);

        // Parse GPT response with new format
        const summaryMatch = content.match(/Summary: (.*?)(?:\n|$)/);
        const descriptionMatch = content.match(/Description: (.*?)(?:\n|$)/);
        const tagsMatch = content.match(/Tags: (.*?)(?:\n|$)/);
        const newTagMatch = content.match(/New tag:\s*(true|false)/i);

        const aiSummary = summaryMatch ? summaryMatch[1].trim() : '';
        const aiDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
        const aiTags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];
        const aiNewTags = newTagMatch ? newTagMatch[1].toLowerCase() === 'true' : false;

        // If we have new tags suggested, handle them appropriately
        if (aiNewTags && aiTags.length > 0) {
          console.log(`New tags suggested for ticket ${ticket.id}: ${aiTags.join(', ')}`);
          
          // Identify which tags are new (not in allowedTags)
          const knownTags = aiTags.filter(tag => allowedTags.includes(tag));
          const newSuggestedTags = aiTags.filter(tag => !allowedTags.includes(tag));
          
          console.log(`Known tags: ${knownTags.join(', ')}`);
          console.log(`New suggested tags: ${newSuggestedTags.join(', ')}`);
          
          // Store new tag suggestions in the tag_suggestions table
          if (newSuggestedTags.length > 0) {
            const insertPromises = newSuggestedTags.map(tag => {
              return supabase
                .from('tag_suggestions')
                .upsert({
                  user_id: ticket.user_id,
                  ticket_id: ticket.id,
                  suggested_tag: tag,
                  status: 'pending'
                }, {
                  onConflict: 'user_id,ticket_id,suggested_tag'
                });
            });
            
            // Wait for all inserts to complete
            const insertResults = await Promise.all(insertPromises);
            
            // Check for errors in the insert operations
            const insertErrors = insertResults.filter(result => result.error);
            if (insertErrors.length > 0) {
              console.error(`Errors inserting tag suggestions:`, insertErrors);
            }
            
            // For analysis, only include the known tags from the allowed list
            // This ensures new tags aren't applied until reviewed
            console.log(`Using only known tags for analysis: ${knownTags.join(', ')}`);
            
            // Update aiTags to only include known tags
            const finalAiTags = knownTags;
            
            // Insert into Supabase with new schema and only known tags
            const { error: insertError } = await supabase
              .from('analysis')
              .upsert({
                ticket_id: ticket.id,
                user_id: ticket.user_id,
                aiSummary,
                aiDescription,
                aiTags: finalAiTags,
                aiNewTags: true // Keep this flag true to indicate there were new tags
              }, { onConflict: 'ticket_id' });

            if (insertError) {
              console.error('Error inserting analysis:', insertError);
              throw new Error(`Failed to insert analysis for ticket ${ticket.id}`);
            }
          }
        } else {
          // No new tags, proceed with normal update
          const { error: insertError } = await supabase
            .from('analysis')
            .upsert({
              ticket_id: ticket.id,
              user_id: ticket.user_id,
              aiSummary,
              aiDescription,
              aiTags,
              aiNewTags
            }, { onConflict: 'ticket_id' });

          if (insertError) {
            console.error('Error inserting analysis:', insertError);
            throw new Error(`Failed to insert analysis for ticket ${ticket.id}`);
          }
        }

        // Add code to generate tag suggestions
        try {
          console.log(`Generating tag suggestions for ticket ${ticket.id}`);
          
          // Use OpenAI to suggest tags based on ticket content
          const tagSuggestionPrompt = `
            Based on the following ticket content, suggest ONLY tags that are HIGHLY relevant to categorize this support request.
            
            ${allowedTags.length > 0 ? 
              `IMPORTANT: You MUST select tags from this list of user-defined tags: ${allowedTags.join(', ')}
               
               Only suggest a new tag (one not in the above list) if there is ABSOLUTELY NO suitable tag in the provided list.
               The threshold for suggesting a new tag should be very high - only when the content truly cannot be categorized by any existing tag.
               Maximum of 1 new tag suggestion is allowed. Always prioritize finding relevant matches in the existing tags.`
              : 
              `Each tag should be 1-3 words, specific, and descriptive of the issue or request.
               Suggest no more than 3 tags total.`
            }
            
            Return only the tags as a JSON array of strings without any explanation.
            
            Ticket Title: ${ticket.subject || ''}
            Ticket Description: ${ticket.description || ''}
            Ticket Conversation: ${ticket.conversation || ''}
          `;
          
          const tagSuggestionResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that suggests relevant tags for customer support tickets.'
              },
              {
                role: 'user',
                content: tagSuggestionPrompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          });
          
          const tagSuggestionsContent = tagSuggestionResponse.choices[0].message.content || '{"tags": []}';
          let suggestedTags: string[] = [];
          
          try {
            const parsedResponse = JSON.parse(tagSuggestionsContent);
            suggestedTags = Array.isArray(parsedResponse.tags) ? parsedResponse.tags : [];
            
            // If the response is directly an array without the tags property
            if (!suggestedTags.length && Array.isArray(parsedResponse)) {
              suggestedTags = parsedResponse;
            }
            
            console.log(`Generated ${suggestedTags.length} tag suggestions for ticket ${ticket.id}:`, suggestedTags);
            
            // Store each suggested tag in the tag_suggestions table
            for (const tag of suggestedTags) {
              // Skip empty tags
              if (!tag || typeof tag !== 'string' || tag.trim() === '') continue;
              
              // Skip tags that are already in the user's tag list
              if (allowedTags.length > 0 && allowedTags.includes(tag.trim())) {
                console.log(`Skipping suggestion for existing tag "${tag}" for ticket ${ticket.id}`);
                continue;
              }
              
              // Limit new tag suggestions when user already has tags defined
              if (allowedTags.length > 0) {
                // Check if we already have a suggestion for this ticket
                const { data: existingSuggestions, error: countError } = await supabase
                  .from('tag_suggestions')
                  .select('id')
                  .eq('user_id', userId)
                  .eq('ticket_id', ticket.id)
                  .eq('status', 'pending');
                  
                if (!countError && existingSuggestions && existingSuggestions.length > 0) {
                  console.log(`Already have ${existingSuggestions.length} tag suggestions for ticket ${ticket.id}, skipping additional suggestions`);
                  continue;
                }
              }
              
              const { error: tagError } = await supabase
                .from('tag_suggestions')
                .insert({
                  user_id: userId,
                  ticket_id: ticket.id,
                  suggested_tag: tag.trim(),
                  status: 'pending',
                });
                
              if (tagError) {
                console.error(`Error saving tag suggestion "${tag}" for ticket ${ticket.id}:`, tagError);
              }
            }
          } catch (parseError) {
            console.error('Error parsing tag suggestions response:', parseError);
          }
        } catch (tagSuggestionError) {
          console.error(`Error generating tag suggestions for ticket ${ticket.id}:`, tagSuggestionError);
          // Continue with the analysis process even if tag suggestion fails
        }

        results.push({
          ticket_id: ticket.id,
          success: true
        });

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Error processing ticket ${ticket.id}:`, error);
        results.push({
          ticket_id: ticket.id,
          success: false,
          error: error.message
        });
      }
    }

    // Mark progress as completed
    await updateAnalysisProgress(userId, totalTickets, processedCount, true);

    // Return summary of results
    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${successCount} out of ${totalTickets} tickets`,
      results,
      count: totalTickets
    });

  } catch (error: any) {
    console.error('Error in analyze-tickets route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 