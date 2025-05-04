"use client";

import { useState } from "react";
import { ExternalLink, X, AlignLeft, Tag as TagIcon, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Button } from "@/components/ui/button";
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
  const [activeTab, setActiveTab] = useState("details");
  
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-start justify-between pb-2 border-b">
          <div>
            <DialogTitle className="pr-6">{ticket.subject}</DialogTitle>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
              <span>#{ticket.zendesk_id}</span>
              <span>•</span>
              <span>{formatTimeAgo(ticket.created_at)}</span>
              <span>•</span>
              <Badge className="font-normal text-[10px] uppercase">{ticket.status}</Badge>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col mt-2">
          <TabsList className="mb-3">
            <TabsTrigger value="details" className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Details
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <AlignLeft className="h-3.5 w-3.5" /> Analysis
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-1">
              <TagIcon className="h-3.5 w-3.5" /> Tags
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value="details" className="mt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-gray-500">Requester</label>
                  <p className="font-medium">
                    {ticket.requester} <span className="font-normal">({ticket.requester_email})</span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Assignee</label>
                  <p className="font-medium">{ticket.assignee || "Unassigned"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Group</label>
                  <p className="font-medium">{ticket.group_name || "No group"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Priority</label>
                  <p className="font-medium">{ticket.priority}</p>
                </div>
                {ticket.source && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Source</label>
                    <p className="font-medium">{getSourceName()}</p>
                  </div>
                )}
              </div>
              
              {analysis.aiSummary && (
                <div className="mt-4">
                  <label className="text-xs font-medium text-gray-500">Summary</label>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">{analysis.aiSummary}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-0">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">AI Summary</label>
                  {analysis.aiSummary ? (
                    <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">{analysis.aiSummary}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400 italic">AI summary coming soon...</p>
                  )}
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500">AI Description</label>
                  {analysis.aiDescription ? (
                    <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">{analysis.aiDescription}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400 italic">AI-enhanced description coming soon...</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tags" className="mt-0">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">AI-Generated Tags</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {analysis.aiTags && Array.isArray(analysis.aiTags) && analysis.aiTags.length > 0 ? (
                      analysis.aiTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="subtle"
                          className="text-xs py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">No AI-generated tags available</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-xs font-medium text-gray-500">Tag Suggestions</label>
                  <div className="mt-2">
                    <TagSuggestions ticketId={ticket.id} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="pt-3 border-t mt-2">
          <a
            href={getTicketSourceUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#0E0E10] hover:bg-black/90 text-white py-2 px-4 rounded-md transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View in {getSourceName()}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
