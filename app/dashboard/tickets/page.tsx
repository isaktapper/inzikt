"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  assignee: string | null;
  group_name: string | null;
  conversation: any[];
  tags: string[];
  created_at: string;
  updated_at: string;
  zendesk_created_at: string;
  zendesk_updated_at: string;
  aiSummary?: string;
  aiDescription?: string;
  aiTags?: string[];
  aiNewTags?: boolean;
  source?: string;
  source_url?: string;
}

interface TicketModalProps {
  ticket: Ticket;
}

const TicketModal = ({ ticket }: TicketModalProps) => {
  const getZendeskTicketId = () => {
    if (!ticket.zendesk_id) return null;
    const parts = ticket.zendesk_id.split("-");
    return parts.length > 1 ? parts[1] : ticket.zendesk_id;
  };

  const getTicketSourceUrl = () => {
    // If source_url is directly available, use it
    if (ticket.source_url) {
      return ticket.source_url;
    }
    
    // Fallback to constructing Zendesk URL
    return getZendeskTicketUrl();
  };
  
  const getSourceName = () => {
    // Return capitalized source name based on ticket.source
    if (ticket.source) {
      return ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1);
    }
    // Default to Zendesk for backward compatibility
    return 'Zendesk';
  };

  const getZendeskTicketUrl = () => {
    const ticketId = getZendeskTicketId();
    const subdomain = process.env.NEXT_PUBLIC_ZENDESK_SUBDOMAIN || "eventlogic";
    return `https://${subdomain}.zendesk.com/agent/tickets/${ticketId}`;
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{ticket.subject}</DialogTitle>
        <div className="text-sm text-gray-500 mt-1">
          Created {new Date(ticket.created_at).toLocaleString()}
        </div>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="font-medium">{ticket.status}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Priority</label>
            <p className="font-medium">{ticket.priority}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Requester</label>
            <p className="font-medium">
              {ticket.requester} <span className="font-normal">({ticket.requester_email})</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Assignee</label>
            <p className="font-medium">{ticket.assignee || 'Unassigned'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Group</label>
            <p className="font-medium">{ticket.group_name || 'No group'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Ticket ID</label>
            <p className="font-medium">{ticket.zendesk_id}</p>
          </div>
          {ticket.source && (
            <div>
              <label className="text-sm font-medium text-gray-500">Source</label>
              <p className="font-medium">{getSourceName()}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
          <label className="text-sm font-medium text-gray-500">Summary</label>
          {ticket.aiSummary ? (
            <p className="text-gray-700">{ticket.aiSummary}</p>
          ) : (
            <p className="text-gray-400 italic">AI summary coming soon...</p>
          )}
        </div>

        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
          <label className="text-sm font-medium text-gray-500">Description</label>
          {ticket.aiDescription ? (
            <p className="text-gray-700">{ticket.aiDescription}</p>
          ) : (
            <p className="text-gray-400 italic">AI-enhanced description coming soon...</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">AI-Generated Tags</label>
          <div className="flex flex-wrap gap-2">
            {ticket.aiTags && ticket.aiTags.length > 0 ? (
              ticket.aiTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-white"
                >
                  {tag}
                  {ticket.aiNewTags && (
                    <span className="ml-1 text-[10px] text-orange-600 font-semibold">NEW</span>
                  )}
                </span>
              ))
            ) : (
              <p className="text-gray-400 italic">No AI-generated tags available</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t mt-4">
          <a
            href={getTicketSourceUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition-colors"
          >
            View in {getSourceName()}
          </a>
        </div>
      </div>
    </DialogContent>
  );
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error("Error fetching tickets:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={fetchTickets}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <span className="text-sm text-gray-500">{tickets.length} tickets</span>
        </div>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Dialog key={ticket.zendesk_id}>
            <DialogTrigger asChild>
              <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>#{ticket.zendesk_id}</span>
                      <span>•</span>
                      <span>{ticket.requester}</span>
                      <span>•</span>
                      <span>{ticket.requester_email}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.status === "open"
                            ? "bg-green-100 text-green-800"
                            : ticket.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority === "normal"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(ticket.zendesk_created_at).toLocaleDateString()}
                  </div>
                </div>

                {ticket.aiTags && ticket.aiTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ticket.aiTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-white"
                      >
                        {tag}
                        {ticket.aiNewTags && (
                          <span className="ml-1 text-[10px] text-orange-600 font-semibold">NEW</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </DialogTrigger>
            <TicketModal ticket={ticket} />
          </Dialog>
        ))}
      </div>
    </div>
  );
}

