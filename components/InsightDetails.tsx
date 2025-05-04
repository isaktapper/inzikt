import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart, AlertTriangle, MessageSquare, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: 'TREND' | 'VOLUME' | 'EMERGING' | 'IMPROVEMENT' | 'ALERT';
  percentage_change: number | null;
  related_tags: string[];
  related_ticket_ids: string[];
  metric_type: string;
  metric_value: number | null;
  time_period: string;
  count: number;
  created_at: string;
}

interface InsightDetailsProps {
  insight: Insight;
}

export function InsightDetails({ insight }: InsightDetailsProps) {
  const [open, setOpen] = useState(false);
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'TREND':
        return <TrendingUp className="h-5 w-5" />
      case 'VOLUME':
        return <BarChart className="h-5 w-5" />
      case 'EMERGING':
        return <TrendingUp className="h-5 w-5" />
      case 'IMPROVEMENT':
        return <TrendingUp className="h-5 w-5" />
      case 'ALERT':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <BarChart className="h-5 w-5" />
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View details <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{insight.title}</DialogTitle>
              <DialogDescription>
                Generated on {formatDate(insight.created_at)}
              </DialogDescription>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1",
              getInsightColor(insight.insight_type, insight.percentage_change)
            )}>
              {getInsightIcon(insight.insight_type)}
              {insight.percentage_change !== null && (
                <span>
                  {insight.percentage_change > 0 ? "+" : ""}
                  {insight.percentage_change.toFixed(1)}%
                </span>
              )}
              {!insight.percentage_change && insight.insight_type}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="related">Related Tickets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{insight.description}</p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Related Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {insight.related_tags.length > 0 ? (
                      insight.related_tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Analyzed tickets</p>
                    <p className="font-medium">{insight.count || 0}</p>
                  </div>
                  
                  {insight.metric_value !== null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{insight.metric_type}</p>
                      <p className="font-medium">{insight.metric_value}</p>
                    </div>
                  )}
                  
                  {insight.percentage_change !== null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Change</p>
                      <p className={cn(
                        "font-medium",
                        insight.percentage_change > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {insight.percentage_change > 0 ? "+" : ""}
                        {insight.percentage_change.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="related">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Related Tickets ({insight.related_ticket_ids.length})
                </CardTitle>
                <CardDescription>
                  {insight.related_ticket_ids.length === 0 
                    ? "No tickets associated with this insight" 
                    : "Tickets that contributed to this insight"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insight.related_ticket_ids.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No related tickets available for this insight.
                  </p>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    This insight is based on {insight.related_ticket_ids.length} tickets.
                    View them in the ticket dashboard for more details.
                  </div>
                )}
              </CardContent>
              {insight.related_ticket_ids.length > 0 && (
                <CardFooter className="border-t pt-4">
                  <Link
                    href={`/dashboard?ticket_ids=${insight.related_ticket_ids.join(',')}`}
                    className="w-full"
                  >
                    <Button className="w-full">
                      View all related tickets
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 