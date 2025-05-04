import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, TrendingUp, BrainCircuit, BarChart3 } from "lucide-react";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricProps {
  period?: string;
}

export function InsightMetrics({ period = "week" }: MetricProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    byTag: {} as Record<string, number>,
    averageScore: 0,
  });
  
  const supabase = createClientSupabaseClient();
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Calculate the date range based on the period
        const now = new Date();
        let startDate = new Date();
        
        if (period === "day") {
          startDate.setDate(now.getDate() - 1);
        } else if (period === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (period === "month") {
          startDate.setMonth(now.getMonth() - 1);
        }
        
        // Fetch insights within the date range
        const { data: insights, error } = await supabase
          .from('insights')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());
        
        if (error) throw error;
        
        // Calculate metrics
        const byType: Record<string, number> = {};
        const byTag: Record<string, number> = {};
        let totalScore = 0;
        
        insights.forEach((insight: any) => {
          // Count by type
          const type = insight.insight_type || 'UNKNOWN';
          byType[type] = (byType[type] || 0) + 1;
          
          // Count by tag
          if (Array.isArray(insight.related_tags)) {
            insight.related_tags.forEach((tag: string) => {
              byTag[tag] = (byTag[tag] || 0) + 1;
            });
          }
          
          // Add to total score (if applicable)
          if (insight.metric_value !== null && typeof insight.metric_value === 'number') {
            totalScore += insight.metric_value;
          }
        });
        
        // Get the average score
        const averageScore = insights.length > 0 ? 
          totalScore / insights.length : 0;
        
        setMetrics({
          total: insights.length,
          byType,
          byTag,
          averageScore
        });
      } catch (error) {
        console.error('Error fetching insight metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [period]);

  // Get top insight types
  const topTypes = Object.entries(metrics.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  // Get top tags
  const topTags = Object.entries(metrics.byTag)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TREND': return 'from-blue-500 to-cyan-500';
      case 'VOLUME': return 'from-orange-500 to-amber-500';
      case 'EMERGING': return 'from-green-500 to-emerald-500';
      case 'IMPROVEMENT': return 'from-teal-500 to-green-500';
      case 'ALERT': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TREND': return <TrendingUp className="h-4 w-4" />;
      case 'VOLUME': return <BarChart className="h-4 w-4" />;
      case 'EMERGING': return <TrendingUp className="h-4 w-4" />;
      case 'IMPROVEMENT': return <TrendingUp className="h-4 w-4" />;
      case 'ALERT': return <BarChart3 className="h-4 w-4" />;
      default: return <BarChart className="h-4 w-4" />;
    }
  };
  
  // Format a period name for display
  const formatPeriod = (periodName: string) => {
    switch (periodName) {
      case 'day': return 'Last 24 Hours';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return 'Recent Period';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Insights</CardTitle>
            <CardDescription>{formatPeriod(period)}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <div className="text-3xl font-bold">{metrics.total}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Insight Types</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="text-3xl font-bold">{Object.keys(metrics.byType).length}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Related Tags</CardTitle>
            <CardDescription>Unique tags identified</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="text-3xl font-bold">{Object.keys(metrics.byTag).length}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Insight Types
            </CardTitle>
            <CardDescription>
              Distribution of insights by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topTypes.length > 0 ? (
              <div className="space-y-3">
                {topTypes.map(([type, count]) => {
                  const percentage = Math.round((count / metrics.total) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full bg-gradient-to-r ${getTypeColor(type)}`}>
                            {getTypeIcon(type)}
                          </div>
                          <span className="font-medium">{type}</span>
                        </div>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getTypeColor(type)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No insight types data available yet
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Top Tags
            </CardTitle>
            <CardDescription>
              Most frequently identified tags
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topTags.length > 0 ? (
              <div className="space-y-3">
                {topTags.map(([tag, count]) => {
                  const maxCount = topTags[0][1];
                  const percentage = Math.round((count / maxCount) * 100);
                  return (
                    <div key={tag} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{tag}</span>
                        <span>{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No tag data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 