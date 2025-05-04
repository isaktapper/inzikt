import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Hash, Percent, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DateRange, ComparisonType } from './TimeFilter';

interface TagStatsProps {
  tagCounts: Record<string, number>;
  prevTagCounts?: Record<string, number>;
  dateRange: DateRange | null;
  comparisonType: ComparisonType;
  ticketCount: number;
  prevTicketCount: number;
}

export function TagStats({ 
  tagCounts, 
  prevTagCounts = {}, 
  dateRange,
  comparisonType,
  ticketCount,
  prevTicketCount
}: TagStatsProps) {
  const totalTags = Object.keys(tagCounts).length;
  const totalUsage = Object.values(tagCounts).reduce((sum, count) => sum + count, 0);
  const avgUsage = totalTags > 0 ? totalUsage / totalTags : 0;
  
  // Get top and bottom 3 tags by usage
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const topTags = sortedTags.slice(0, 3);
  const bottomTags = sortedTags.slice(-3).reverse();
  
  // Compare with previous period if available
  const isComparing = comparisonType !== 'none' && Object.keys(prevTagCounts).length > 0;
  
  // Calculate growth rates for each stat
  const tagCountGrowth = calculateGrowthRate(
    totalTags,
    Object.keys(prevTagCounts).length
  );
  
  const usageGrowth = calculateGrowthRate(
    totalUsage,
    Object.values(prevTagCounts).reduce((sum, count) => sum + count, 0)
  );
  
  // Calculate growth rates for top tags
  const topTagGrowthRates = topTags.map(([tag, count]) => {
    const prevCount = prevTagCounts[tag] || 0;
    return {
      tag,
      count,
      prevCount,
      growthRate: calculateGrowthRate(count, prevCount)
    };
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Total Tags" 
        value={totalTags} 
        icon={<Hash className="h-4 w-4 text-blue-500" />}
        description="Unique tags in system"
        growthRate={isComparing ? tagCountGrowth : undefined}
      />
      <StatCard 
        title="Total Usage" 
        value={totalUsage} 
        icon={<BarChart3 className="h-4 w-4 text-indigo-500" />}
        description="Tag applications across tickets"
        growthRate={isComparing ? usageGrowth : undefined}
      />
      <StatCard 
        title="Avg. Per Tag" 
        value={avgUsage.toFixed(1)} 
        icon={<Percent className="h-4 w-4 text-violet-500" />}
        description="Average usage frequency"
      />
      
      {totalTags > 0 && (
        <>
          <Card className="md:col-span-3 shadow-none border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribution Highlights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Top Used Tags</h3>
                <div className="space-y-1.5">
                  {topTags.map(([tag, count], index) => {
                    const growthRate = isComparing
                      ? calculateGrowthRate(count, prevTagCounts[tag] || 0)
                      : null;
                      
                    return (
                      <div key={tag} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-5 text-xs text-muted-foreground">{index + 1}.</div>
                          <div className="font-medium">{tag}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="text-sm">{count}</div>
                          <div className="text-xs text-muted-foreground">
                            ({((count / totalUsage) * 100).toFixed(1)}%)
                          </div>
                          
                          {isComparing && growthRate !== null && (
                            <div className={`text-xs ml-2 ${getGrowthColor(growthRate)}`}>
                              {renderGrowthIndicator(growthRate)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Least Used Tags</h3>
                <div className="space-y-1.5">
                  {bottomTags.map(([tag, count], index) => (
                    <div key={tag} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-5 text-xs text-muted-foreground">{totalTags - index}.</div>
                        <div className="font-medium">{tag}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          ({((count / totalUsage) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  growthRate?: number | null;
}

function StatCard({ title, value, icon, description, growthRate }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon}
        </div>
        <div className="flex items-end gap-2">
          <div className="text-2xl font-bold">{value}</div>
          
          {growthRate !== null && growthRate !== undefined && (
            <div className={`text-xs pb-1 ${getGrowthColor(growthRate)}`}>
              {renderGrowthIndicator(growthRate)}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions for growth rate calculations and display
function calculateGrowthRate(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function getGrowthColor(growthRate: number | null): string {
  if (growthRate === null) return 'text-muted-foreground';
  if (growthRate > 0) return 'text-green-600';
  if (growthRate < 0) return 'text-red-600';
  return 'text-muted-foreground';
}

function renderGrowthIndicator(growthRate: number | null): React.ReactNode {
  if (growthRate === null) return null;
  
  const absGrowth = Math.abs(growthRate);
  const formattedGrowth = absGrowth.toFixed(1);
  
  if (growthRate > 0) {
    return (
      <div className="flex items-center">
        <TrendingUp className="h-3 w-3 mr-0.5" />
        <span>{formattedGrowth}%</span>
      </div>
    );
  } else if (growthRate < 0) {
    return (
      <div className="flex items-center">
        <TrendingDown className="h-3 w-3 mr-0.5" />
        <span>{formattedGrowth}%</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center">
        <Minus className="h-3 w-3 mr-0.5" />
        <span>0%</span>
      </div>
    );
  }
} 