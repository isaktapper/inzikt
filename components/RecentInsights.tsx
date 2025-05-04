import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, AlertTriangle, TrendingUp, MessageSquare, ExternalLink } from "lucide-react";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: 'TREND' | 'VOLUME' | 'EMERGING' | 'IMPROVEMENT' | 'ALERT';
  percentage_change: number | null;
  related_tags: string[];
  related_ticket_ids: string[];
  count: number;
  created_at: string;
}

export function RecentInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientSupabaseClient();
  
  useEffect(() => {
    const fetchRecentInsights = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Fetch recent insights
        const { data, error } = await supabase
          .from('insights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) throw error;
        
        // Augment insights with default count if missing
        const processedInsights = data.map((insight: any) => ({
          ...insight,
          count: insight.related_ticket_ids?.length || 0,
          related_tags: insight.related_tags || []
        }));
        
        setInsights(processedInsights);
      } catch (error) {
        console.error('Error fetching recent insights:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentInsights();
  }, []);
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'TREND':
        return <TrendingUp className="h-4 w-4" />
      case 'VOLUME':
        return <BarChart className="h-4 w-4" />
      case 'EMERGING':
        return <TrendingUp className="h-4 w-4" />
      case 'IMPROVEMENT':
        return <TrendingUp className="h-4 w-4" />
      case 'ALERT':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <BarChart className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string, change: number | null) => {
    if (type === 'ALERT') return "text-red-700 bg-red-100"
    if (type === 'IMPROVEMENT') return "text-green-700 bg-green-100"
    
    if (change) {
      return change > 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
    }
    
    return "text-blue-700 bg-blue-100"
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Latest Insights
        </CardTitle>
        <CardDescription>
          Recent AI-generated insights from your tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-2 pb-4 border-b last:border-0 last:pb-0">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BarChart className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No insights available yet</p>
            <p className="text-xs text-muted-foreground">
              Generate insights to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className={cn(
                  "p-2 rounded-full flex items-center justify-center",
                  getInsightColor(insight.insight_type, insight.percentage_change)
                )}>
                  {getInsightIcon(insight.insight_type)}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm leading-tight line-clamp-1">{insight.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(insight.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-1 flex-wrap">
                      {insight.related_tags.slice(0, 2).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs px-1.5 py-0 h-5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {insight.related_tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          +{insight.related_tags.length - 2} more
                        </Badge>
                      )}
                    </div>
                    
                    {insight.related_ticket_ids?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>{insight.related_ticket_ids.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <Link href="/dashboard/insights" className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View all insights
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 