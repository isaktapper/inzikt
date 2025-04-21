"use client";

import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { TagSuggestions } from './TagSuggestions';

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
  source?: string;
  source_url?: string;
}

interface TicketModalProps {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
}

export function TicketModal({ ticket, open, onClose }: TicketModalProps) {
  // Extract analysis data, checking both direct fields and nested structure
  const getAnalysisData = (): AnalysisData => {
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
      : { aiSummary: null, aiDescription: null, aiTags: [], aiNewTags: false };
  };
  
  const analysis = getAnalysisData();

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return new Date(dateString).toLocaleString();
    }
  };
  
  const getZendeskTicketId = () => {
    if (!ticket.zendesk_id) return null;
    const parts = ticket.zendesk_id.split("-");
    return parts.length > 1 ? parts[1] : ticket.zendesk_id;
  };

  const getZendeskTicketUrl = () => {
    const ticketId = getZendeskTicketId();
    const subdomain = process.env.NEXT_PUBLIC_ZENDESK_SUBDOMAIN || "eventlogic";
    return `https://${subdomain}.zendesk.com/agent/tickets/${ticketId}`;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <div className="text-sm text-gray-500 mt-1">
            Created {formatTimeAgo(ticket.created_at)}
          </div>
        </DialogHeader>
        <div className="space-y-6">
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
              <p className="font-medium">{ticket.assignee || "Unassigned"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Group</label>
              <p className="font-medium">{ticket.group_name || "No group"}</p>
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
            {analysis.aiSummary ? (
              <p className="text-gray-700">{analysis.aiSummary}</p>
            ) : (
              <p className="text-gray-400 italic">AI summary coming soon...</p>
            )}
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <label className="text-sm font-medium text-gray-500">Description</label>
            {analysis.aiDescription ? (
              <p className="text-gray-700">{analysis.aiDescription}</p>
            ) : (
              <p className="text-gray-400 italic">AI-enhanced description coming soon...</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">AI-Generated Tags</label>
            <div className="flex flex-wrap gap-2">
              {analysis.aiTags && Array.isArray(analysis.aiTags) && analysis.aiTags.length > 0 ? (
                analysis.aiTags.map((tag) => (
                  <Badge
                    key={tag}
                    className="px-3 py-1 text-sm bg-primary text-white hover:bg-primary/90 rounded-full"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-400 italic">No AI-generated tags available</p>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <label className="text-sm font-medium text-gray-500">Tag Suggestions</label>
            <TagSuggestions ticketId={ticket.id} />
          </div>

          <div className="pt-4 border-t mt-4">
            <a
              href={getTicketSourceUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View in {getSourceName()}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
