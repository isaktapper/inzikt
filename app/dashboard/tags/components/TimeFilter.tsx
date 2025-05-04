import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowRight, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type DateRange = {
  from: Date;
  to: Date;
};

export type TimeFilterPeriod = 'last7days' | 'last30days' | 'lastMonth' | 'thisMonth' | 'thisYear' | 'custom';
export type ComparisonType = 'none' | 'previousPeriod' | 'sameLastYear';

export interface TimeFilterProps {
  onTimeFilterChange: (dateRange: DateRange | null) => void;
  onComparisonChange: (type: ComparisonType) => void;
  ticketCount: number;
  previousTicketCount: number;
}

export function TimeFilter({ 
  onTimeFilterChange, 
  onComparisonChange,
  ticketCount,
  previousTicketCount 
}: TimeFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFilterPeriod>('last30days');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
  
  // Calculate percentage change
  const percentChange = useMemo(() => {
    if (previousTicketCount === 0) return ticketCount > 0 ? 100 : 0;
    if (ticketCount === 0) return -100;
    return ((ticketCount - previousTicketCount) / previousTicketCount) * 100;
  }, [ticketCount, previousTicketCount]);

  // Create date ranges based on the selected period
  const getDateRangeForPeriod = useCallback((period: TimeFilterPeriod): DateRange => {
    const today = new Date();
    
    switch(period) {
      case 'last7days':
        return { from: subDays(today, 7), to: today };
      case 'last30days':
        return { from: subDays(today, 30), to: today };
      case 'lastMonth': {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return { 
          from: startOfMonth(lastMonth), 
          to: endOfMonth(lastMonth) 
        };
      }
      case 'thisMonth':
        return { from: startOfMonth(today), to: today };
      case 'thisYear':
        return { from: startOfYear(today), to: today };
      case 'custom':
        return customDateRange;
    }
  }, [customDateRange]);

  // Memoize the current date range
  const currentDateRange = useMemo(() => 
    getDateRangeForPeriod(selectedPeriod), 
  [selectedPeriod, getDateRangeForPeriod]);

  // Update date range whenever period or custom range changes
  const updateDateRange = useCallback(() => {
    onTimeFilterChange(currentDateRange);
  }, [currentDateRange, onTimeFilterChange]);

  // Call parent handlers when values change
  useEffect(() => {
    updateDateRange();
  }, [updateDateRange]);

  useEffect(() => {
    onComparisonChange(comparisonType);
  }, [comparisonType, onComparisonChange]);

  // Format date range for display
  const formatDateRange = useMemo(() => {
    const { from, to } = currentDateRange;
    return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
  }, [currentDateRange]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <CardTitle className="text-lg">Time Period</CardTitle>
            <CardDescription>
              Filter tickets by time period
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Currently showing: <span className="font-medium">{formatDateRange}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Time period selection - horizontal layout */}
          <div className="md:flex-1">
            <RadioGroup 
              value={selectedPeriod} 
              onValueChange={(value: TimeFilterPeriod) => setSelectedPeriod(value)}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last7days" id="last7days" />
                <Label htmlFor="last7days">Last 7 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last30days" id="last30days" />
                <Label htmlFor="last30days">Last 30 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lastMonth" id="lastMonth" />
                <Label htmlFor="lastMonth">Last month</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisMonth" id="thisMonth" />
                <Label htmlFor="thisMonth">This month</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisYear" id="thisYear" />
                <Label htmlFor="thisYear">This year</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom range</Label>
              </div>
            </RadioGroup>
            
            {/* Calendar popup for custom date range */}
            {selectedPeriod === 'custom' && (
              <div className="mt-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-auto justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.from && customDateRange?.to ? (
                        <>
                          {format(customDateRange.from, "LLL dd, y")} -{" "}
                          {format(customDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={customDateRange}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange(range as DateRange);
                        }
                      }}
                      numberOfMonths={2}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          
          {/* Comparison section */}
          <div className="border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 md:min-w-[280px]">
            <div>
              <Label className="mb-2 block">Compare with:</Label>
              <ToggleGroup 
                type="single" 
                variant="outline" 
                className="justify-start flex-wrap" 
                value={comparisonType} 
                onValueChange={(value: ComparisonType) => value && setComparisonType(value)}
              >
                <ToggleGroupItem value="none" className="text-xs">
                  No comparison
                </ToggleGroupItem>
                <ToggleGroupItem value="previousPeriod" className="text-xs">
                  Previous period
                </ToggleGroupItem>
                <ToggleGroupItem value="sameLastYear" className="text-xs">
                  Same period last year
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {/* Comparison results */}
            {comparisonType !== 'none' && (
              <div className="mt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{ticketCount} tickets</div>
                    <div className="text-xs text-muted-foreground">Current period</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium flex items-center justify-end gap-1">
                      {previousTicketCount} tickets
                      {percentChange !== 0 && (
                        <span 
                          className={cn(
                            "text-xs font-medium ml-1.5 flex items-center",
                            percentChange > 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {percentChange > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {Math.abs(Math.round(percentChange))}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {comparisonType === 'previousPeriod' ? 'Previous period' : 'Last year'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Reset button */}
          <div className="flex items-center md:self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPeriod('last30days');
                setComparisonType('none');
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Reset filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 