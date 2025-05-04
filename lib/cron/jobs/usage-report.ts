import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';
import { sendEmail } from '@/lib/email';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UsageReportParams {
  days_back?: number;
  admin_email?: string;
}

export async function runUsageReport(params: UsageReportParams = {}): Promise<any> {
  const { days_back = 1, admin_email } = params;
  
  console.log(`Generating usage report for the last ${days_back} day(s)`);
  
  // Set date range
  const endDate = new Date();
  const startDate = subDays(endDate, days_back);
  
  try {
    // Get active users
    const { data: activeUsers, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email');
      
    if (userError) throw userError;
    
    // Collect usage data for each user
    const usageReport = [];
    
    for (const user of activeUsers || []) {
      // Get usage records for this user
      const { data: userUsage, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString());
        
      if (usageError) throw usageError;
      
      // Aggregate by metric
      const metricTotals: Record<string, number> = {};
      (userUsage || []).forEach(record => {
        metricTotals[record.metric] = (metricTotals[record.metric] || 0) + record.value;
      });
      
      // Get ticket count
      const { count: ticketCount, error: ticketError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (ticketError) throw ticketError;
      
      // Add to report
      usageReport.push({
        user_id: user.id,
        name: user.full_name,
        email: user.email,
        ticket_count: ticketCount,
        usage: metricTotals
      });
    }
    
    // Generate report summary
    const summary = {
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      total_users: usageReport.length,
      active_users: usageReport.filter(u => Object.keys(u.usage).length > 0).length,
      report_data: usageReport
    };
    
    // Store report in database
    const { data: reportData, error: reportError } = await supabase
      .from('system_reports')
      .insert({
        report_type: 'usage',
        data: summary,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (reportError) throw reportError;
    
    console.log(`Usage report ${reportData.id} generated successfully`);
    
    // Send email report if admin_email is provided
    if (admin_email) {
      const emailHtml = generateReportEmailHtml(summary);
      
      await sendEmail({
        to: admin_email,
        subject: `Usage Report: ${summary.period.start} to ${summary.period.end}`,
        html: emailHtml
      });
      
      console.log(`Usage report email sent to ${admin_email}`);
    }
    
    return {
      report_id: reportData.id,
      summary: {
        total_users: summary.total_users,
        active_users: summary.active_users,
        period: summary.period
      },
      email_sent: !!admin_email
    };
  } catch (error) {
    console.error('Error generating usage report:', error);
    throw error;
  }
}

/**
 * Generate HTML content for the usage report email
 */
function generateReportEmailHtml(summary: any): string {
  const { period, total_users, active_users, report_data } = summary;
  
  // Create a simple table of top users
  const topUsers = report_data
    .filter((user: any) => Object.keys(user.usage).length > 0)
    .sort((a: any, b: any) => {
      // Sort by total usage across all metrics
      const aTotal = Object.values(a.usage).reduce((sum: number, val: any) => sum + val, 0);
      const bTotal = Object.values(b.usage).reduce((sum: number, val: any) => sum + val, 0);
      return bTotal - aTotal;
    })
    .slice(0, 10); // Top 10 users
  
  const userRows = topUsers.map((user: any) => {
    const totalUsage = Object.values(user.usage).reduce((sum: number, val: any) => sum + val, 0);
    return `
      <tr>
        <td>${user.name || 'Unknown'}</td>
        <td>${user.email}</td>
        <td>${user.ticket_count || 0}</td>
        <td>${totalUsage}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1>Usage Report</h1>
        <p>Period: ${period.start} to ${period.end}</p>
        
        <h2>Summary</h2>
        <ul>
          <li>Total Users: ${total_users}</li>
          <li>Active Users: ${active_users}</li>
        </ul>
        
        <h2>Top Users</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>Name</th>
              <th>Email</th>
              <th>Tickets</th>
              <th>Total Usage</th>
            </tr>
          </thead>
          <tbody>
            ${userRows}
          </tbody>
        </table>
        
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reports" style="color: #0366d6;">View Full Report</a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated report generated by the KISA Platform. Please do not reply to this email.
        </p>
      </body>
    </html>
  `;
} 