import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Record usage for a specific metric
 */
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  metric: string,
  value: number,
  details?: Record<string, any>
) {
  try {
    const { error } = await supabase
      .from('user_usage')
      .insert({
        user_id: userId,
        metric,
        value,
        details,
        recorded_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error recording usage for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get usage summary for a user within a time period
 */
export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string,
  metric?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    // Build query
    let query = supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId);
      
    // Apply filters
    if (metric) {
      query = query.eq('metric', metric);
    }
    
    if (startDate) {
      query = query.gte('recorded_at', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('recorded_at', endDate.toISOString());
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting usage for user ${userId}:`, error);
    return [];
  }
}

/**
 * Check if user has exceeded usage limits
 */
export async function checkUsageLimits(supabase: SupabaseClient, userId: string, metric: string, planLimit: number) {
  try {
    // Get monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const usage = await getUserUsage(supabase, userId, metric, startOfMonth, endOfMonth);
    
    // Sum up all values for this metric
    const totalUsage = usage.reduce((sum, record) => sum + (record.value || 0), 0);
    
    return {
      exceeded: totalUsage >= planLimit,
      current: totalUsage,
      limit: planLimit,
      remaining: Math.max(0, planLimit - totalUsage),
      percentage: Math.min(100, Math.round((totalUsage / planLimit) * 100))
    };
  } catch (error) {
    console.error(`Error checking usage limits for user ${userId}:`, error);
    return {
      exceeded: false,
      current: 0,
      limit: planLimit,
      remaining: planLimit,
      percentage: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 