import React from "react";

interface ImportProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function ImportProgress({ current, total, className = "" }: ImportProgressProps) {
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-[#111827]">Progress</span>
        <span className="text-sm text-[#111827]">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#6366F1] h-2.5 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Analyzing {current} of {total} tickets
      </p>
    </div>
  );
}

// This component shows a list of tickets with status indicators
interface TicketItemProps {
  id: string;
  subject: string;
  isCompleted: boolean;
}

export function TicketList({ 
  tickets 
}: { 
  tickets: TicketItemProps[] 
}) {
  return (
    <div className="space-y-3 mt-4">
      {tickets.map((ticket, i) => (
        <div key={i} className="flex items-center p-2 border rounded-md">
          <div className={`h-2 w-2 rounded-full mr-2 ${
            ticket.isCompleted ? "bg-green-500" : "bg-gray-300"
          }`}></div>
          <span className="text-sm text-[#111827]">
            Ticket #{ticket.id}: {ticket.subject}
          </span>
        </div>
      ))}
      {tickets.length === 0 && (
        <div className="p-2 text-center text-sm text-gray-500">
          No tickets to display
        </div>
      )}
    </div>
  );
}

// Main component that combines both progress and ticket list
export function ImportingTickets({
  current,
  total,
  tickets = [],
  className = ""
}: {
  current: number;
  total: number;
  tickets?: TicketItemProps[];
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-medium mb-4 text-[#111827]">Importing tickets</h3>
      <ImportProgress current={current} total={total} />
      <TicketList tickets={tickets} />
    </div>
  );
} 