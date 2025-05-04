import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReminderParams {
  user_id: string;
  item_id: string;
  type: 'task' | 'ticket' | 'event';
}

export async function sendReminder(params: ReminderParams): Promise<any> {
  const { user_id, item_id, type } = params;
  
  console.log(`Sending reminder for ${type} ${item_id} to user ${user_id}`);
  
  // Get user information
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, first_name, last_name')
    .eq('id', user_id)
    .single();
    
  if (userError || !user) {
    throw new Error(`Failed to fetch user: ${userError?.message || 'User not found'}`);
  }
  
  // Get item information based on type
  let item;
  let itemError;
  
  switch (type) {
    case 'task':
      ({ data: item, error: itemError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', item_id)
        .single());
      break;
    case 'ticket':
      ({ data: item, error: itemError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', item_id)
        .single());
      break;
    case 'event':
      ({ data: item, error: itemError } = await supabase
        .from('events')
        .select('*')
        .eq('id', item_id)
        .single());
      break;
    default:
      throw new Error(`Invalid item type: ${type}`);
  }
  
  if (itemError || !item) {
    throw new Error(`Failed to fetch ${type}: ${itemError?.message || `${type} not found`}`);
  }
  
  // Send email reminder
  const title = item.title || item.name || `Your ${type}`;
  const dueDate = item.due_date || item.start_date || item.date;
  
  await sendEmail({
    to: user.email,
    subject: `Reminder: ${title}`,
    html: `
      <p>Hello ${user.first_name || 'there'},</p>
      <p>This is a reminder about your upcoming ${type}:</p>
      <h2>${title}</h2>
      ${dueDate ? `<p>Due date: ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
      <p>You can view the details and take action by logging into your account.</p>
      <p>Best regards,<br>KISA Team</p>
    `
  });
  
  // Log the reminder in the activity log
  const { data: logData, error: logError } = await supabase
    .from('activity_logs')
    .insert({
      user_id,
      entity_type: type,
      entity_id: item_id,
      action: 'reminder_sent',
      description: `Reminder sent for ${type}: ${title}`,
      created_at: new Date().toISOString()
    });
    
  if (logError) {
    console.error(`Failed to log reminder activity: ${logError.message}`);
  }
  
  return {
    success: true,
    message: `Reminder sent to ${user.email}`,
    userId: user_id,
    itemId: item_id,
    itemType: type
  };
} 