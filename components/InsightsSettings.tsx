import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Clock, CreditCard, Check, X } from "lucide-react";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

// Type for period options
interface PeriodOption {
  value: string;
  label: string;
  description: string;
}

// Available period options
const periodOptions: PeriodOption[] = [
  { value: 'week', label: 'Weekly', description: 'Last 7 days' },
  { value: 'month', label: 'Monthly', description: 'Last 30 days' },
  { value: 'quarter', label: 'Quarterly', description: 'Last 3 months' },
  { value: 'half_year', label: 'Half-yearly', description: 'Last 6 months' },
  { value: 'year', label: 'Yearly', description: 'Last 12 months' },
];

// Mapping from frequency to primary period
const frequencyToPeriod: Record<string, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  quarterly: 'quarter',
  half_yearly: 'half_year',
  yearly: 'year'
};

// This component allows users to configure automatic insights generation
export function InsightsSettings() {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<string>("weekly");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['week']);
  
  const supabase = createClientSupabaseClient();

  // Load the current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // Find the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Look for existing scheduled job for insights
        const { data: jobs, error } = await supabase
          .from('scheduled_jobs')
          .select('*')
          .eq('user_id', user.id)
          .eq('job_type', 'generate-insights')
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // This is the expected "not found" error code - it's normal if no job exists yet
            console.log('No existing job found, will create a new one when settings are saved');
          } else {
            // This is an unexpected error
            console.error('Error fetching job settings:', error);
          }
        } else if (jobs) {
          setJobId(jobs.id);
          setEnabled(jobs.enabled || false);
          setFrequency(jobs.frequency || 'weekly');
          
          // Set selected periods if they exist
          if (jobs.parameters && jobs.parameters.periods) {
            setSelectedPeriods(jobs.parameters.periods);
          } else if (jobs.parameters && jobs.parameters.period) {
            // Legacy: convert single period to array
            setSelectedPeriods([jobs.parameters.period]);
          }
        }
      } catch (error) {
        console.error('Error loading insights settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Update selected periods when frequency changes
  useEffect(() => {
    const primaryPeriod = frequencyToPeriod[frequency] || 'week';
    if (!selectedPeriods.includes(primaryPeriod)) {
      setSelectedPeriods([...selectedPeriods, primaryPeriod]);
    }
  }, [frequency]);
  
  // Toggle a period selection
  const togglePeriod = (period: string) => {
    // Don't allow deselecting the primary period based on frequency
    const primaryPeriod = frequencyToPeriod[frequency] || 'week';
    if (period === primaryPeriod && selectedPeriods.includes(period)) {
      return;
    }
    
    setSelectedPeriods(prev => 
      prev.includes(period)
        ? prev.filter(p => p !== period)
        : [...prev, period]
    );
  };

  // Save the settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Find the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save your settings.",
          variant: "destructive"
        });
        return;
      }
      
      // Determine appropriate primary period based on frequency
      const primaryPeriod = frequencyToPeriod[frequency] || 'week';
      
      // Ensure primary period is included
      let periods = [...selectedPeriods];
      if (!periods.includes(primaryPeriod)) {
        periods.push(primaryPeriod);
      }
      
      // Prepare the job data
      const jobData = {
        job_type: 'generate-insights',
        frequency,
        user_id: user.id,
        parameters: {
          periods, // Array of periods for multi-period analysis
          period: primaryPeriod, // For backward compatibility
          compare_with: 'previous_period',
          user_id: user.id
        },
        enabled,
        updated_at: new Date().toISOString()
      };
      
      if (jobId) {
        // Update existing job
        const { error } = await supabase
          .from('scheduled_jobs')
          .update(jobData)
          .eq('id', jobId);
          
        if (error) throw error;
      } else {
        // Create new job
        const { data, error } = await supabase
          .from('scheduled_jobs')
          .insert({
            ...jobData,
            next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (error) throw error;
        setJobId(data.id);
      }
      
      toast({
        title: "Settings saved",
        description: enabled 
          ? `Automatic insights will be generated ${frequency}.` 
          : "Automatic insights generation is disabled."
      });
    } catch (error) {
      console.error('Error saving insights settings:', error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your insights settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" /> 
          Automatic Insights
        </CardTitle>
        <CardDescription>
          Configure when and how often to automatically generate AI insights from your tickets.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="insights-enabled" className="flex-1">
            <div className="font-medium">Enable automatic insights</div>
            <p className="text-sm text-muted-foreground">
              Automatically generate insights based on your tickets
            </p>
          </Label>
          <Switch
            id="insights-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={loading}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="insights-frequency">Generation frequency</Label>
            <Select
              disabled={!enabled || loading}
              value={frequency}
              onValueChange={setFrequency}
            >
              <SelectTrigger id="insights-frequency" className="w-full mt-1">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Daily (last 24 hours)</span>
                  </div>
                </SelectItem>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Weekly (last 7 days)</span>
                  </div>
                </SelectItem>
                <SelectItem value="monthly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Monthly (last 30 days)</span>
                  </div>
                </SelectItem>
                <SelectItem value="quarterly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Quarterly (last 3 months)</span>
                  </div>
                </SelectItem>
                <SelectItem value="half_yearly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Half-yearly (last 6 months)</span>
                  </div>
                </SelectItem>
                <SelectItem value="yearly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Yearly (last 12 months)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Analysis periods</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Select which time periods to analyze. Multiple periods provide more comprehensive insights.
            </p>
            
            <div className="space-y-2 border rounded-md p-3">
              {periodOptions.map((option) => {
                const isPrimary = frequencyToPeriod[frequency] === option.value;
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`period-${option.value}`}
                      checked={selectedPeriods.includes(option.value)}
                      onCheckedChange={() => togglePeriod(option.value)}
                      disabled={loading || isPrimary} // Can't uncheck primary period
                    />
                    <Label 
                      htmlFor={`period-${option.value}`}
                      className="flex-1 cursor-pointer flex justify-between items-center"
                    >
                      <span>{option.label} ({option.description})</span>
                      {isPrimary && (
                        <span className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5">
                          Primary
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The primary period (determined by frequency) cannot be deselected.
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={saveSettings} 
          disabled={loading || saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </CardFooter>
    </Card>
  );
} 