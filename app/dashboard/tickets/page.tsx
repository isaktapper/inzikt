"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Filter, SortDesc, Check, ExternalLink, MessageSquare, AlignLeft, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState("details");

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
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader className="flex flex-row items-start justify-between pb-2 border-b">
        <div>
          <DialogTitle className="pr-6">{ticket.subject}</DialogTitle>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
            <span>#{ticket.zendesk_id}</span>
            <span>•</span>
            <span>{new Date(ticket.created_at).toLocaleString()}</span>
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
            
            {ticket.aiSummary && (
              <div className="mt-4">
                <label className="text-xs font-medium text-gray-500">Summary</label>
                <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">{ticket.aiSummary}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-0">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">AI Summary</label>
                {ticket.aiSummary ? (
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">{ticket.aiSummary}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400 italic">AI summary coming soon...</p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">AI Description</label>
                {ticket.aiDescription ? (
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">{ticket.aiDescription}</p>
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
                  {ticket.aiTags && ticket.aiTags.length > 0 ? (
                    ticket.aiTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="subtle"
                        className="text-xs py-0.5"
                      >
                        {tag}
                        {ticket.aiNewTags && (
                          <span className="ml-1 text-[8px] text-highlight-orange font-semibold">NEW</span>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No AI-generated tags available</p>
                  )}
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
  );
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [activeFilters, setActiveFilters] = useState<{
    status: string[];
    priority: string[];
  }>({
    status: [],
    priority: [],
  });
  const [sortOption, setSortOption] = useState<string>("date-desc");
  const ticketsPerPage = 10;

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      // Default sort by zendesk_created_at date descending (newest first)
      const sortedTickets = [...(data.tickets || [])].sort((a, b) => 
        new Date(b.zendesk_created_at).getTime() - new Date(a.zendesk_created_at).getTime()
      );
      setTickets(sortedTickets);
      setFilteredTickets(sortedTickets);
      setTotalTickets(sortedTickets.length);
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

  // Apply filters and sort
  useEffect(() => {
    let result = [...tickets];
    
    // Apply status filters
    if (activeFilters.status.length > 0) {
      result = result.filter(ticket => 
        activeFilters.status.includes(ticket.status)
      );
    }
    
    // Apply priority filters
    if (activeFilters.priority.length > 0) {
      result = result.filter(ticket => 
        activeFilters.priority.includes(ticket.priority)
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "date-desc":
        result.sort((a, b) => new Date(b.zendesk_created_at).getTime() - new Date(a.zendesk_created_at).getTime());
        break;
      case "date-asc":
        result.sort((a, b) => new Date(a.zendesk_created_at).getTime() - new Date(b.zendesk_created_at).getTime());
        break;
      case "alpha-asc":
        result.sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case "alpha-desc":
        result.sort((a, b) => b.subject.localeCompare(a.subject));
        break;
      case "priority-high":
        result.sort((a, b) => {
          const priorityOrder = { "high": 0, "normal": 1, "low": 2 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
        });
        break;
      case "status":
        result.sort((a, b) => {
          const statusOrder = { "open": 0, "pending": 1, "solved": 2, "closed": 3 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 4) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 4);
        });
        break;
    }
    
    setFilteredTickets(result);
    setTotalTickets(result.length);
    setCurrentPage(1); // Reset to first page when filtering/sorting changes
  }, [tickets, activeFilters, sortOption]);

  // Filter helpers
  const toggleStatusFilter = (status: string) => {
    setActiveFilters(prev => {
      const newStatusFilters = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return {
        ...prev,
        status: newStatusFilters
      };
    });
  };

  const togglePriorityFilter = (priority: string) => {
    setActiveFilters(prev => {
      const newPriorityFilters = prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority];
      
      return {
        ...prev,
        priority: newPriorityFilters
      };
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      status: [],
      priority: [],
    });
  };

  // Calculate pagination values
  const totalPages = Math.ceil(totalTickets / ticketsPerPage);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Get list of available statuses and priorities from tickets
  const availableStatuses = Array.from(new Set(tickets.map(ticket => ticket.status)));
  const availablePriorities = Array.from(new Set(tickets.map(ticket => ticket.priority)));

  // Get sort option text
  const getSortOptionText = () => {
    switch (sortOption) {
      case "date-desc": return "Newest First";
      case "date-asc": return "Oldest First";
      case "alpha-asc": return "A-Z";
      case "alpha-desc": return "Z-A";
      case "priority-high": return "Priority (High→Low)";
      case "status": return "Status";
      default: return "Sort";
    }
  };

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

  const hasActiveFilters = activeFilters.status.length > 0 || activeFilters.priority.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={hasActiveFilters ? "default" : "outline"} 
                size="sm"
                className={hasActiveFilters ? "bg-primary text-white" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter {hasActiveFilters && `(${activeFilters.status.length + activeFilters.priority.length})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter Tickets</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-gray-500 px-2 pt-2">Status</DropdownMenuLabel>
                {availableStatuses.map(status => (
                  <DropdownMenuItem 
                    key={`status-${status}`} 
                    onClick={() => toggleStatusFilter(status)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center w-full justify-between">
                      <span className="capitalize">{status}</span>
                      {activeFilters.status.includes(status) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-gray-500 px-2 pt-2">Priority</DropdownMenuLabel>
                {availablePriorities.map(priority => (
                  <DropdownMenuItem 
                    key={`priority-${priority}`} 
                    onClick={() => togglePriorityFilter(priority)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center w-full justify-between">
                      <span className="capitalize">{priority}</span>
                      {activeFilters.priority.includes(priority) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={clearFilters}
                    className="text-red-500 cursor-pointer"
                  >
                    Clear All Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortDesc className="h-4 w-4 mr-2" />
                {getSortOptionText()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort Tickets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSortOption("date-desc")}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full justify-between">
                  <span>Newest First</span>
                  {sortOption === "date-desc" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption("date-asc")}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full justify-between">
                  <span>Oldest First</span>
                  {sortOption === "date-asc" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption("alpha-asc")}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full justify-between">
                  <span>A-Z</span>
                  {sortOption === "alpha-asc" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption("alpha-desc")}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full justify-between">
                  <span>Z-A</span>
                  {sortOption === "alpha-desc" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption("priority-high")}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full justify-between">
                  <span>Priority (High→Low)</span>
                  {sortOption === "priority-high" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption("status")}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full justify-between">
                  <span>Status</span>
                  {sortOption === "status" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={fetchTickets}
            size="sm"
            className="bg-primary text-white hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <span className="text-sm text-gray-500">{totalTickets} tickets</span>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.status.map(status => (
            <div 
              key={`active-filter-status-${status}`} 
              className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
            >
              <span>Status: {status}</span>
              <button 
                onClick={() => toggleStatusFilter(status)}
                className="text-primary hover:text-primary/70"
              >
                ×
              </button>
            </div>
          ))}
          {activeFilters.priority.map(priority => (
            <div 
              key={`active-filter-priority-${priority}`} 
              className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
            >
              <span>Priority: {priority}</span>
              <button 
                onClick={() => togglePriorityFilter(priority)}
                className="text-primary hover:text-primary/70"
              >
                ×
              </button>
            </div>
          ))}
          <button 
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* No results message */}
      {filteredTickets.length === 0 && !loading && (
        <div className="bg-gray-50 rounded-md py-8 text-center">
          <p className="text-gray-500">No tickets match your current filters.</p>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-primary hover:text-primary/70 underline mt-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Ticket list */}
      <div className="space-y-1">
        {currentTickets.map((ticket) => (
          <Dialog key={ticket.zendesk_id}>
            <DialogTrigger asChild>
              <div className="bg-white rounded-md shadow-sm py-3 px-4 hover:shadow transition-shadow cursor-pointer border border-gray-100">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-gray-500 text-sm font-mono">
                      #{ticket.zendesk_id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</h3>
                      <p className="text-xs text-gray-500 truncate mt-1">{ticket.description?.substring(0, 100)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {ticket.aiTags && ticket.aiTags.length > 0 && (
                        ticket.aiTags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))
                      )}
                      {ticket.aiTags && ticket.aiTags.length > 2 && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          +{ticket.aiTags.length - 2}
                        </span>
                      )}
                    </div>
                    
                    {/* Status & Priority */}
                    <div className="flex gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                    
                    {/* Date */}
                    <span className="text-xs text-gray-500 whitespace-nowrap min-w-[80px] text-right">
                      {new Date(ticket.zendesk_created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <TicketModal ticket={ticket} />
          </Dialog>
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                
                // For fewer than 8 pages, show all page numbers
                if (totalPages <= 7) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => paginate(pageNumber)}
                        isActive={pageNumber === currentPage}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // For more pages, show first, last, current and adjacent pages
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => paginate(pageNumber)}
                        isActive={pageNumber === currentPage}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis for gaps
                if (
                  (pageNumber === 2 && currentPage > 3) ||
                  (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${pageNumber}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

