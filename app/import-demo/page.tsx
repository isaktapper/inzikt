import { TicketImportDemo } from "@/components/ticket-import-demo";

export default function ImportDemoPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-[#111827]">Ticket Import Progress Demo</h1>
        <p className="text-[#111827]/70 mt-2">
          This page demonstrates the ticket import progress component with a realistic simulation.
        </p>
      </header>
      
      <main className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <TicketImportDemo />
          
          <div className="mt-12 p-6 bg-white rounded-xl border">
            <h2 className="text-xl font-bold text-[#111827] mb-4">How to use this component</h2>
            <p className="text-[#111827]/80 mb-4">
              In a real application, you would pass the current number of imported tickets and total tickets to the
              ImportProgress component. This allows you to show real-time progress to your users.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-sm overflow-x-auto">
{`// Import the component
import { ImportingTickets } from "@/components/ui/import-progress";

// Use in your component
<ImportingTickets 
  current={importedCount} 
  total={totalCount} 
  tickets={ticketsBeingProcessed}
/>

// Or use just the progress bar
<ImportProgress 
  current={importedCount} 
  total={totalCount} 
/>`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 