"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/types/ticket";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import { TicketModal } from "../components/TicketModal";
import { Loader2, AlertTriangle } from "lucide-react";
import { TagFilter } from "./components/TagFilter";
import { TaggedTickets } from "./components/TaggedTickets";
import { TagStats } from "./components/TagStats";
import { TimeFilter, DateRange, ComparisonType } from "./components/TimeFilter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addYears, subDays } from "date-fns";

export default function TagsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('OR');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
          .from("tickets_with_analysis")
          .select("*");
          
        if (error) throw error;
        setTickets(data || []);
      } catch (error: any) {
        setErrorMessage(error.message || "Failed to load tickets");
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  // Filter tickets based on date range
  const filteredTickets = useMemo(() => {
    if (!dateRange) return tickets;
    
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.zendesk_created_at || ticket.created_at);
      return ticketDate >= dateRange.from && ticketDate <= dateRange.to;
    });
  }, [tickets, dateRange]);
  
  // Calculate comparison period tickets
  const comparisonTickets = useMemo(() => {
    if (comparisonType === 'none' || !dateRange) return [];
    
    let comparisonFrom: Date;
    let comparisonTo: Date;
    
    if (comparisonType === 'previousPeriod') {
      // Calculate the previous period with same length
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      comparisonTo = new Date(dateRange.from.getTime() - 1); // Day before current period
      comparisonFrom = new Date(comparisonTo.getTime() - periodLength);
    } else if (comparisonType === 'sameLastYear') {
      // Same period last year
      comparisonFrom = addYears(dateRange.from, -1);
      comparisonTo = addYears(dateRange.to, -1);
    } else {
      return [];
    }
    
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.zendesk_created_at || ticket.created_at);
      return ticketDate >= comparisonFrom && ticketDate <= comparisonTo;
    });
  }, [tickets, dateRange, comparisonType]);

  // Build tag counts from filtered tickets
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(ticket => {
      (ticket.aiTags || []).forEach(tag => {
        const clean = tag.trim();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return counts;
  }, [filteredTickets]);
  
  // Build tag counts from comparison period
  const prevTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    comparisonTickets.forEach(ticket => {
      (ticket.aiTags || []).forEach(tag => {
        const clean = tag.trim();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return counts;
  }, [comparisonTickets]);

  // Handle tag toggle for filtering
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Clear all selected tags
  const clearFilters = () => {
    setSelectedTags([]);
  };
  
  // Handle time filter changes
  const handleTimeFilterChange = (range: DateRange | null) => {
    setDateRange(range);
  };
  
  // Handle comparison type changes
  const handleComparisonChange = (type: ComparisonType) => {
    setComparisonType(type);
  };
  
  // Handle viewing a ticket
  const handleViewTicket = (ticket: Ticket) => {
    setModalTicket(ticket);
  };
  
  // Generate tags if there are none
  const handleGenerateTags = async () => {
    try {
      setIsGeneratingTags(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Get user domain
      const supabase = createClientSupabaseClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('domain')
        .single();
        
      if (!profile?.domain) {
        setErrorMessage("No domain set up. Please set up your domain in settings.");
        return;
      }
      
      // Call API to generate tags
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;
      
      if (!authToken) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      const response = await fetch('/api/generate-tags-from-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ domain: profile.domain }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate tags');
      }
      
      const data = await response.json();
      setSuccessMessage(`Successfully generated ${data.tags.length} tags. Refreshing page...`);
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred while generating tags');
      console.error('Error:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading tags data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Alert messages */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <h1 className="text-3xl font-bold mb-6">Tags</h1>
      
      {/* No tags state */}
      {Object.keys(tagCounts).length === 0 && tickets.length > 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-4">No tags available</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Generate AI tags to help categorize and understand your support tickets.
            </p>
            <Button
              onClick={handleGenerateTags}
              className="px-6"
              disabled={isGeneratingTags}
            >
              {isGeneratingTags ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Generate Tags'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Time Filter at the top with full width */}
          <div className="mb-6">
            <TimeFilter 
              onTimeFilterChange={handleTimeFilterChange}
              onComparisonChange={handleComparisonChange}
              ticketCount={filteredTickets.length}
              previousTicketCount={comparisonTickets.length}
            />
          </div>
            
          {/* Tag statistics */}
          <div className="mb-6">
            <TagStats 
              tagCounts={tagCounts} 
              prevTagCounts={comparisonType !== 'none' ? prevTagCounts : undefined}
              dateRange={dateRange}
              comparisonType={comparisonType}
              ticketCount={filteredTickets.length}
              prevTicketCount={comparisonTickets.length}
            />
          </div>
          
          {/* Main content with filter sidebar and tickets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <TagFilter 
                tagCounts={tagCounts}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onClearFilters={clearFilters}
                filterLogic={filterLogic}
                setFilterLogic={setFilterLogic}
              />
            </div>
            
            <div className="md:col-span-2">
              <TaggedTickets 
                tickets={filteredTickets}
                selectedTags={selectedTags}
                filterLogic={filterLogic}
                dateRange={dateRange}
                onViewTicket={handleViewTicket}
              />
            </div>
          </div>
        </>
      )}
      
      {/* Ticket modal */}
      {modalTicket && (
        <TicketModal ticket={modalTicket} open={true} onClose={() => setModalTicket(null)} />
      )}
    </div>
  );
}