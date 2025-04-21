"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImportingTickets } from "@/components/ui/import-progress";

export function TicketImportDemo() {
  const [importing, setImporting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(500);
  const [tickets, setTickets] = useState<Array<{id: string; subject: string; isCompleted: boolean}>>([]);
  
  // Function to simulate starting an import
  const startImport = () => {
    if (importing) return;
    
    setImporting(true);
    setCurrent(0);
    setTotal(500);
    
    // Generate some sample tickets to show
    const sampleTickets = [
      { id: "5423", subject: "Product not working after update", isCompleted: false },
      { id: "5422", subject: "Can't login to account", isCompleted: false },
      { id: "5421", subject: "How do I export my data?", isCompleted: false },
      { id: "5420", subject: "Feature request: dark mode", isCompleted: false },
      { id: "5419", subject: "Billing question", isCompleted: false },
    ];
    
    setTickets(sampleTickets);
  };
  
  // Effect to simulate the import progress
  useEffect(() => {
    if (!importing) return;
    
    const interval = setInterval(() => {
      setCurrent(prev => {
        // Complete the process when reaching the total
        if (prev >= total) {
          clearInterval(interval);
          setImporting(false);
          return total;
        }
        
        // Update tickets status as they get processed
        const ticketIndex = Math.floor(prev / (total / tickets.length));
        if (ticketIndex < tickets.length && !tickets[ticketIndex].isCompleted) {
          const updatedTickets = [...tickets];
          updatedTickets[ticketIndex].isCompleted = true;
          setTickets(updatedTickets);
        }
        
        // Increment by random amount to make it look realistic
        const increment = Math.floor(Math.random() * 20) + 5;
        return Math.min(prev + increment, total);
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [importing, total, tickets]);
  
  return (
    <div className="p-6 bg-[#FAFAFA] rounded-xl">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#111827]">Ticket Import</h2>
        <Button 
          onClick={startImport} 
          disabled={importing}
          className="bg-[#6366F1] text-white hover:bg-indigo-600"
        >
          {importing ? "Importing..." : "Start Import"}
        </Button>
      </div>
      
      {(importing || current > 0) && (
        <ImportingTickets 
          current={current} 
          total={total} 
          tickets={tickets}
        />
      )}
      
      {!importing && current === 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
          <p className="text-[#111827]">Click "Start Import" to begin importing tickets</p>
        </div>
      )}
      
      {!importing && current === total && (
        <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
          <p>Import complete! All {total} tickets have been processed.</p>
        </div>
      )}
    </div>
  );
} 