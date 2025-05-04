"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  Filter,
  RefreshCw,
  Loader2,
  Check,
  Calendar,
  Tag,
  Eye,
  Sparkles,
  TrendingUp,
  Lightbulb,
  PieChart,
  BrainCircuit
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import Link from "next/link"
import { TicketModal } from './TicketModal'
import { RecentInsights } from '@/components/RecentInsights'

interface AnalysisData {
  aiSummary: string | null;
  aiDescription: string | null;
  aiTags: string[];
  aiNewTags: boolean;
}

interface Ticket {
  id: string;
  zendesk_id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requester: string;
  requester_email: string;
  assignee?: string | null;
  group_name?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  zendesk_created_at: string;
  zendesk_updated_at: string;
  analysis?: AnalysisData[] | null;
  aiSummary?: string | null;
  aiDescription?: string | null;
  aiTags?: string[];
  aiNewTags?: boolean;
}

interface DashboardStats {
  statusCount: Record<string, number>;
  priorityCount: Record<string, number>;
  tagCount: Record<string, number>;
  ticketsByDay: Record<string, number>;
}

const STATUS_COLORS = {
  solved: 'bg-green-500',
  open: 'bg-blue-500',
  pending: 'bg-yellow-500',
  closed: 'bg-gray-500',
  default: 'bg-gray-400'
};

const PRIORITY_COLORS = {
  low: 'bg-blue-500',
  normal: 'bg-green-500',
  high: 'bg-yellow-500',
  urgent: 'bg-red-500',
  default: 'bg-gray-400'
};

// Primary gradient class for special highlights only
const PRIMARY_GRADIENT = "bg-gradient-to-r from-orange-400 to-pink-500";
const PRIMARY_HOVER_GRADIENT = "hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-600";

// Helper function to get analysis from ticket
const getAnalysis = (ticket: Ticket): AnalysisData | null => {
  // If direct fields exist on the ticket, use those
  if (ticket.aiSummary !== undefined || ticket.aiDescription !== undefined || ticket.aiTags !== undefined) {
    return {
      aiSummary: ticket.aiSummary || null,
      aiDescription: ticket.aiDescription || null,
      aiTags: ticket.aiTags || [],
      aiNewTags: ticket.aiNewTags || false
    };
  }
  
  // Fallback to nested analysis structure if it exists
  return Array.isArray(ticket.analysis) && ticket.analysis.length > 0 
    ? ticket.analysis[0] 
    : null;
};

const processTickets = (tickets: Ticket[]): DashboardStats => {
  const statusCount = tickets.reduce((acc, ticket) => {
    const status = ticket.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCount = tickets.reduce((acc, ticket) => {
    const priority = ticket.priority || 'unknown';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tagCount = tickets.reduce((acc, ticket) => {
    const analysis = getAnalysis(ticket);
    const tags = analysis?.aiTags || [];
    tags.forEach(tag => {
      if (tag && tag.trim()) acc[tag.trim()] = (acc[tag.trim()] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  // Group tickets by day for the last 7 days
  const ticketsByDay: Record<string, number> = {};
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  
  // Initialize all 7 days with 0
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    ticketsByDay[dateString] = 0;
  }
  
  // Count tickets per day
  tickets.forEach(ticket => {
    const date = new Date(ticket.zendesk_created_at || ticket.created_at);
    if (date >= sevenDaysAgo && date <= today) {
      const dateString = date.toISOString().split('T')[0];
      ticketsByDay[dateString] = (ticketsByDay[dateString] || 0) + 1;
    }
  });

  return { statusCount, priorityCount, tagCount, ticketsByDay };
};

// Generate insight cards based on ticket data
const generateInsights = (tickets: Ticket[]): string[] => {
  const insights: string[] = [];
  
  if (tickets.length === 0) return insights;
  
  // Minimum ticket threshold for insights
  if (tickets.length < 10) return insights;
  
  const analyzedCount = tickets.filter(t => {
    const analysis = getAnalysis(t);
    return analysis?.aiSummary && analysis.aiSummary.trim().length > 0;
  }).length;
  
  const taggedCount = tickets.filter(t => {
    const analysis = getAnalysis(t);
    return analysis?.aiTags && analysis.aiTags.length > 0;
  }).length;
  
  // Ticket volume insight
  if (tickets.length > 20) {
    insights.push(`You've processed ${tickets.length} tickets, which provides a good foundation for trend analysis.`);
  }
  
  // Analysis coverage insight
  if (analyzedCount > 0) {
    const percentage = Math.round((analyzedCount / tickets.length) * 100);
    insights.push(`${percentage}% of your tickets have been analyzed by AI, providing valuable patterns and trends.`);
  }
  
  // Category insights
  const stats = processTickets(tickets);
  const topTags = Object.entries(stats.tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
    
  if (topTags.length > 0) {
    insights.push(`"${topTags[0][0]}" is your most common ticket category, representing ${Math.round((topTags[0][1] / taggedCount) * 100)}% of all analyzed tickets.`);
  }
  
  // Status distribution insight
  const openTickets = stats.statusCount['open'] || 0;
  if (openTickets > 0) {
    insights.push(`You have ${openTickets} open tickets that may need your attention.`);
  }
  
  return insights.slice(0, 4); // Return up to 4 insights
};

// Icon mapping for insights
const getInsightIcon = (index: number) => {
  const icons = [
    <Lightbulb key="lightbulb" className="h-5 w-5 text-highlight-orange" />,
    <PieChart key="chart" className="h-5 w-5 text-highlight-pink" />,
    <TrendingUp key="trending" className="h-5 w-5 text-highlight-orange" />,
    <BrainCircuit key="brain" className="h-5 w-5 text-highlight-pink" />
  ];
  return icons[index % icons.length];
};

interface DashboardContentProps {
  initialTickets: Ticket[];
  isZendeskConnected: boolean;
  firstName: string | null;
}

export function DashboardContent({ initialTickets, isZendeskConnected, firstName }: DashboardContentProps) {
  const [tickets] = useState(initialTickets);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<DashboardStats>(processTickets(tickets));
  
  useEffect(() => {
    // Generate insights when the component mounts
    const newInsights = generateInsights(tickets);
    setInsights(newInsights);
  }, [tickets]);

  // Debug: Log ticket structure
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      console.log('Client: Sample ticket:', tickets[0]);
      const analysis = getAnalysis(tickets[0]);
      console.log('Client: Extracted analysis:', analysis);
    }
  }, [tickets]);

  // Format distance to now for timestamps
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDisconnectZendesk = async () => {
    try {
      const response = await fetch('/api/zendesk/connection', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Zendesk');
      }
      
      // Reload the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting from Zendesk:', error);
      alert('Failed to disconnect from Zendesk. Please try again.');
    }
  };
  
  const handleAnalyzeTickets = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-tickets', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to analyze tickets');
      window.location.reload();
    } catch (error) {
      console.error('Error analyzing tickets:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Get top 5 tags
  const topTags = Object.entries(stats.tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
    
  // Calculate max for tag visualization
  const maxTagCount = topTags.length > 0 ? topTags[0][1] : 0;
  
  // Prepare activity chart data
  const activityData = Object.entries(stats.ticketsByDay).sort(([a], [b]) => a.localeCompare(b));
  const maxActivity = Math.max(...Object.values(stats.ticketsByDay), 1);

  return (
    <div className="w-full space-y-8">
      {/* Header with greeting and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b w-full gap-4">
        <h1 className="text-2xl font-bold">
          Hey {firstName || 'there'} 👋
        </h1>
        <div className="flex items-center gap-4">
          {/* Removing Settings button */}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="w-full overflow-hidden shadow-sm hover:shadow transition-all duration-300 group border-gray-100 border-l-4 border-l-highlight-orange">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-gray-500">Imported Tickets</h3>
                <div className="text-3xl font-bold group-hover:translate-x-1 transition-transform duration-300">{tickets.length}</div>
              </div>
              <div className="bg-orange-100 p-2.5 rounded-full group-hover:bg-orange-200 transition-colors duration-300">
                <Check className="h-5 w-5 text-highlight-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden shadow-sm hover:shadow transition-all duration-300 group border-gray-100 border-l-4 border-l-highlight-pink">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-gray-500">Analyzed Tickets</h3>
                <div className="text-3xl font-bold group-hover:translate-x-1 transition-transform duration-300">
                  {tickets.filter(t => {
                    const analysis = getAnalysis(t);
                    return analysis?.aiSummary && analysis.aiSummary.trim().length > 0;
                  }).length}
                </div>
              </div>
              <div className="bg-pink-100 p-2.5 rounded-full group-hover:bg-pink-200 transition-colors duration-300">
                <BrainCircuit className="h-5 w-5 text-highlight-pink" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden shadow-sm hover:shadow transition-all duration-300 group border-gray-100 border-l-4 border-l-[#0E0E10]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-gray-500">AI-Generated Tags</h3>
                <div className="text-3xl font-bold group-hover:translate-x-1 transition-transform duration-300">
                  {Object.keys(stats.tagCount).length}
                </div>
              </div>
              <div className="bg-gray-100 p-2.5 rounded-full group-hover:bg-gray-200 transition-colors duration-300">
                <Tag className="h-5 w-5 text-[#0E0E10]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity chart and insights split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-highlight-orange" />
              <CardTitle className="text-lg font-semibold">7-Day Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {activityData.length > 0 ? (
              <div className="h-44 flex items-end justify-between gap-1">
                {activityData.map(([date, count], index) => {
                  const height = (count / maxActivity) * 100;
                  const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={date} className="flex flex-col items-center gap-1 flex-1">
                      <div 
                        className="w-full bg-[#0E0E10] rounded-t transition-all duration-300 hover:opacity-90" 
                        style={{ height: `${Math.max(height, 5)}%` }}
                      ></div>
                      <span className="text-xs text-gray-500">{formattedDate}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-gray-500">No activity data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <div className="lg:col-span-2">
          <RecentInsights />
        </div>
      </div>

      {/* Top 5 Tags */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-highlight-orange" />
          <h2 className="text-xl font-semibold">Top 5 Tags</h2>
        </div>
        
        {topTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {topTags.map(([tag, count]) => {
              const percentage = Math.round((count / maxTagCount) * 100);
              return (
                <div 
                  key={tag} 
                  className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-highlight-orange"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{tag}</span>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full bg-[#0E0E10]" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="w-full bg-gray-50 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500">No AI-generated tags available yet</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Tickets Table */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-highlight-orange" />
          <h2 className="text-xl font-semibold">Recent Tickets</h2>
        </div>
        
        <div className="overflow-hidden bg-white shadow-sm rounded-lg border border-gray-100">
          <div className="min-w-full divide-y divide-gray-200">
            <div className="bg-gray-50">
              <div className="grid grid-cols-12 gap-2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">ID</div>
                <div className="col-span-5">Subject</div>
                <div className="col-span-3">Tags</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1">Action</div>
              </div>
            </div>
            
            <div className="bg-white divide-y divide-gray-200">
              {tickets.length > 0 ? (
                tickets.slice(0, 5).map((ticket) => {
                  const analysis = getAnalysis(ticket);
                  return (
                    <div 
                      key={ticket.id} 
                      className="grid grid-cols-12 gap-2 px-6 py-4 text-sm group hover:bg-gray-50 transition-colors duration-300"
                    >
                      <div className="col-span-1 font-medium text-gray-900">
                        {ticket.zendesk_id}
                      </div>
                      <div className="col-span-5">
                        <div className="font-medium text-gray-900">
                          {ticket.subject}
                          {analysis?.aiSummary && (
                            <Badge className="ml-2 text-white text-xs" variant="gradient">Analyzed</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {analysis?.aiSummary 
                            ? analysis.aiSummary.substring(0, 60) + (analysis.aiSummary.length > 60 ? '...' : '')
                            : 'No summary available'}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1">
                          {analysis?.aiTags && Array.isArray(analysis.aiTags) && analysis.aiTags.length > 0 
                            ? analysis.aiTags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} className="text-xs" variant="subtle">
                                {tag}
                              </Badge>
                            ))
                            : <span className="text-xs text-gray-500">No tags</span>
                          }
                          {analysis?.aiTags && Array.isArray(analysis.aiTags) && analysis.aiTags.length > 3 && (
                            <Badge className="text-xs bg-gray-200 text-gray-700">
                              +{analysis.aiTags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">
                        {formatDate(ticket.zendesk_created_at || ticket.created_at)}
                      </div>
                      <div className="col-span-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 h-8 w-8 relative group"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4 group-hover:opacity-0 transition-opacity" />
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs font-medium text-highlight-orange transition-opacity">
                            View details
                          </span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-4 text-sm text-center text-gray-500">
                  No tickets available
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
