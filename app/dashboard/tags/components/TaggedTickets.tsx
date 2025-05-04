import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import type { Ticket } from '@/types/ticket';
import { DateRange } from './TimeFilter';
import { isWithinInterval } from 'date-fns';

interface TaggedTicketsProps {
  tickets: Ticket[];
  selectedTags: string[];
  filterLogic: 'AND' | 'OR';
  dateRange: DateRange | null;
  onViewTicket: (ticket: Ticket) => void;
}

export function TaggedTickets({
  tickets,
  selectedTags,
  filterLogic,
  dateRange,
  onViewTicket
}: TaggedTicketsProps) {
  // Filter tickets based on selected tags, filter logic, and date range
  const filteredTickets = tickets.filter(ticket => {
    // Check tags filter
    const ticketTags = ticket.aiTags || [];
    let matchesTags = true;
    
    if (selectedTags.length > 0) {
      if (filterLogic === 'AND') {
        // All selected tags must be present
        matchesTags = selectedTags.every(tag => ticketTags.includes(tag));
      } else {
        // At least one selected tag must be present
        matchesTags = selectedTags.some(tag => ticketTags.includes(tag));
      }
    }
    
    // Check date range filter
    let matchesDateRange = true;
    if (dateRange) {
      const ticketDate = new Date(ticket.zendesk_created_at || ticket.created_at);
      matchesDateRange = isWithinInterval(ticketDate, {
        start: dateRange.from,
        end: dateRange.to
      });
    }
    
    return matchesTags && matchesDateRange;
  });
  
  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex justify-between items-center">
          <span>Tickets {selectedTags.length > 0 ? 'by Tags' : ''}</span>
          <Badge variant="outline" className="font-normal">
            {filteredTickets.length} result{filteredTickets.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          {selectedTags.length > 0 && (
            <span>
              {filterLogic === 'AND' 
                ? 'Showing tickets matching ALL selected tags' 
                : 'Showing tickets matching ANY selected tag'}
            </span>
          )}
          {dateRange && (
            <span className="ml-1">
              {selectedTags.length > 0 ? ' and ' : ''}
              created between {dateRange.from.toLocaleDateString()} and {dateRange.to.toLocaleDateString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tickets match your current filters
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                className="p-4 border rounded-md hover:bg-muted/30 transition-colors"
              >
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium truncate pr-4">{ticket.subject}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => onViewTicket(ticket)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-wrap gap-1.5 max-w-[75%]">
                    {(ticket.aiTags || []).map(tag => (
                      <Badge 
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(ticket.zendesk_created_at || ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 