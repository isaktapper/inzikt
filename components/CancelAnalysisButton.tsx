import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { createClientSupabaseClient } from '@/utils/supabase/client';

interface CancelAnalysisButtonProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  iconOnly?: boolean;
  onCancel?: () => void;
}

export function CancelAnalysisButton({
  size = 'default',
  variant = 'destructive',
  className = '',
  iconOnly = false,
  onCancel
}: CancelAnalysisButtonProps) {
  const [canceling, setCanceling] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const handleCancelAnalysis = async () => {
    try {
      setCanceling(true);

      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to cancel an analysis job",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/analyze-tickets/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel analysis');
      }

      toast({
        title: "Analysis canceled",
        description: "The analysis job has been successfully canceled.",
      });

      // Call the onCancel callback if provided
      if (onCancel) {
        onCancel();
      }

      // Refresh the jobs page if the user is on it
      if (window.location.pathname.includes('/jobs')) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error canceling analysis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel analysis',
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleCancelAnalysis}
      disabled={canceling}
    >
      {canceling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {!iconOnly && "Canceling..."}
        </>
      ) : (
        <>
          <XCircle className={`h-4 w-4 ${iconOnly ? '' : 'mr-2'}`} />
          {!iconOnly && "Cancel Analysis"}
        </>
      )}
    </Button>
  );
} 