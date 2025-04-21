"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/types/ticket";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import { TicketModal } from "../components/TicketModal";
import { Loader2, Globe } from "lucide-react";
import TagSetupModal from "@/app/components/TagSetupModal";

export default function TagsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTagSetupModal, setShowTagSetupModal] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase.from("tickets_with_analysis").select("*");
      if (!error && data) setTickets(data);
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      const filtered = tickets.filter((t) => (t.aiTags || []).includes(selectedTag));
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets([]);
    }
  }, [selectedTag, tickets]);

  const tagCount: Record<string, number> = {};
  tickets.forEach((ticket) => {
    (ticket.aiTags || []).forEach((tag) => {
      const clean = tag.trim();
      if (clean) tagCount[clean] = (tagCount[clean] || 0) + 1;
    });
  });

  const totalUsage = Object.values(tagCount).reduce((sum, count) => sum + count, 0);
  const averageUsage = Object.keys(tagCount).length > 0 ? totalUsage / Object.keys(tagCount).length : 0;
  
  const handleGenerateTags = () => {
    // Don't use TagSetupModal when clicking Generate Tags button,
    // since this can conflict with ticket analysis
    try {
      setIsGeneratingTags(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Use the domain-based tag generation API directly
      const getUserDomain = async () => {
        const supabase = createClientSupabaseClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('domain')
          .single();
          
        if (profile?.domain) {
          // Call the API endpoint directly with the saved domain
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
        } else {
          // No domain saved yet, open the TagSetupModal
          setShowTagSetupModal(true);
        }
      };
      
      getUserDomain();
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred while generating tags');
      console.error('Error:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Tag Setup Modal that can be shown/hidden */}
      {showTagSetupModal && (
        <TagSetupModal 
          isOpen={showTagSetupModal} 
          onClose={() => setShowTagSetupModal(false)} 
        />
      )}
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Tags</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-generated tags to help categorize and understand your support tickets.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
        
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Unique Tags" value={Object.keys(tagCount).length} />
            <StatCard title="Total Usage" value={totalUsage} />
            <StatCard title="Average Usage" value={averageUsage.toFixed(1)} />
          </div>

          {Object.keys(tagCount).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No tags found. Generate tags to categorize your tickets.</p>
              <Button 
                onClick={handleGenerateTags} 
                className="mb-2"
                disabled={isGeneratingTags}
              >
                {isGeneratingTags ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Tags...
                  </>
                ) : (
                  'Generate Tags'
                )}
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                This will analyze your website to generate relevant support tags.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagCount).map(([tag, count]) => (
                <Button
                  key={tag}
                  variant="outline"
                  className={`bg-primary text-white hover:bg-primary/90 text-sm ${selectedTag === tag ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag} ({count})
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTag && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle>Tickets tagged with "{selectedTag}"</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tickets found.</p>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-gray-500">{ticket.requester}</p>
                    </div>
                    <Button variant="link" onClick={() => setModalTicket(ticket)}>
                      View details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {modalTicket && (
        <TicketModal ticket={modalTicket} open={true} onClose={() => setModalTicket(null)} />
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 border rounded-lg text-center w-full">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}