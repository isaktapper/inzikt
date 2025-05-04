"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Home,
  Tag,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Search,
  Zap,
  RefreshCw,
  Check,
  Sparkles,
  Briefcase,
  ServerCog,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/utils/supabase/client"
import TagSetupModal from "@/app/components/TagSetupModal"
import { getUserProfile, Profile } from "@/lib/getUserProfile"
import { useAnalysisProgress } from '@/contexts/AnalysisProgressContext'
import { toast } from "@/components/ui/use-toast"
import { JobsDropdown } from "@/components/JobsDropdown"
import { ActiveJobsBadge } from "@/components/ActiveJobsBadge"

interface NavItem {
  href: string
  icon: typeof Home
  label: string
}

// Extended profile with additional UI-specific fields
interface DashboardUserProfile extends Profile {
  email: string
  avatar_url?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/insights", icon: BarChart3, label: "Insights" },
  { href: "/dashboard/tickets", icon: MessageSquare, label: "Tickets" },
  { href: "/dashboard/recommendations", icon: ShoppingBag, label: "Recommendations" },
  { href: "/dashboard/tags", icon: Tag, label: "Tags" },
  { href: "/jobs", icon: ServerCog, label: "Jobs" },
]

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [hasTicketsToAnalyze, setHasTicketsToAnalyze] = useState(true)
  const [isAnalyzingTickets, setIsAnalyzingTickets] = useState(false)
  const [userProfile, setUserProfile] = useState<DashboardUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClientSupabaseClient())
  const { startAnalysis, isAnalyzing } = useAnalysisProgress()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const profile = await getUserProfile();
        
        // Get the current user to access email and auth metadata (not in profile)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No authenticated user found, redirecting to login");
          router.push('/login');
          return;
        }
        
        // Fetch the full profile data from Supabase to check the payment status
        const { data: fullProfile, error: fullProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (fullProfileError) {
          console.error("Error fetching full profile:", fullProfileError);
          router.push('/login');
          return;
        }
        
        // Check if the user has an active plan
        if (fullProfile && fullProfile.plan_active !== true) {
          console.log("User does not have an active plan, redirecting to payment");
          router.push('/billing/plans');
          return;
        }
        
        setUserProfile({
          ...profile,
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url
        });
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router, supabase]);
  
  // Check for unanalyzed tickets
  useEffect(() => {
    const checkTicketsStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // First check if we have any tickets at all
        const { data: allTickets, error: fetchError } = await supabase
          .from('tickets')
          .select('id')
          .eq('user_id', user.id); // Ensure we're only getting this user's tickets

        if (fetchError) {
          console.error(`Error checking tickets: ${fetchError.message || fetchError}`);
          // Set default state - assume we need to analyze if we can't check
          setHasTicketsToAnalyze(false);
          return;
        }

        if (!allTickets || allTickets.length === 0) {
          // No tickets to analyze
          setHasTicketsToAnalyze(false);
          return;
        }
        
        const totalTickets = allTickets.length;
        
        // Get all analyzed ticket IDs for this user
        const { data: analyzedData, error: analyzedError } = await supabase
          .from('analysis')
          .select('ticket_id')
          .in('ticket_id', allTickets.map(t => t.id)); // Only check analysis for this user's tickets
        
        if (analyzedError) {
          console.error(`Error checking analyzed tickets: ${analyzedError.message || analyzedError}`);
          // Default to showing the analyze button if we can't check
          setHasTicketsToAnalyze(true);
          return;
        }
        
        // Create a set of analyzed ticket IDs for faster lookup
        const analyzedIds = new Set((analyzedData || []).map(item => item.ticket_id));
        
        // Find tickets that don't have analysis
        const unanalyzedTickets = allTickets.filter(ticket => !analyzedIds.has(ticket.id));
        const unanalyzedCount = unanalyzedTickets.length;
        
        // Only show the analyze button if there are unanalyzed tickets
        setHasTicketsToAnalyze(unanalyzedCount > 0);
        
        console.log(`Tickets status: ${totalTickets - unanalyzedCount} analyzed out of ${totalTickets} total, unanalyzed: ${unanalyzedCount}`);
      } catch (error) {
        // Handle any unexpected errors
        console.error(`Error checking tickets: ${error instanceof Error ? error.message : String(error)}`);
        // Default to showing analyze button in case of error so user can try to analyze
        setHasTicketsToAnalyze(true);
      }
    };
    
    if (!loading && userProfile) {
      checkTicketsStatus();
    }
  }, [supabase, loading, userProfile]);
  
  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      // First clear cookies on the client side
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=");
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Then use Supabase signOut
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      
      console.log("Signed out successfully, redirecting to login");
      // Use direct navigation instead of router to ensure a full page reload
      window.location.href = '/login';
    } catch (error) {
      console.error("Error in handleLogout:", error);
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userProfile?.full_name) return '?'
    
    return userProfile.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Handle analyzing tickets
  const handleAnalyzeTickets = async () => {
    if (!userProfile) return;
    
    setIsAnalyzingTickets(true);
    try {
      // Start the progress tracking - provide a temporary job ID until we get the real one
      startAnalysis(userProfile.id, 'temp-job-id');
      
      // Send the user ID with the request
      const response = await fetch('/api/analyze-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userProfile.id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze tickets');
      }
      
      // Provide feedback based on the result
      if (result.count === 0) {
        toast({
          title: 'No new tickets to analyze',
          description: 'All your tickets have already been analyzed.',
        });
        setIsAnalyzingTickets(false);
      } else {
        toast({
          title: 'Analysis started',
          description: `Analyzing ${result.count || 'your'} tickets...`,
        });
      }
    } catch (error) {
      console.error('Error analyzing tickets:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze tickets. Please try again.',
        variant: 'destructive',
      });
      setIsAnalyzingTickets(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Only render content when loading is complete */}
      {loading ? (
        <div className="flex items-center justify-center w-full min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Tag Setup Modal */}
          <TagSetupModal />
          
          {/* Main Header */}
          <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white flex items-center px-6">
            <div className="flex items-center h-full">
              <Link href="/" className="flex items-center mr-6">
                <img 
                  src="/inzikt_logo.svg" 
                  alt="Inzikt Logo" 
                  className="h-8 w-auto" 
                />
              </Link>
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-xl ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  type="search" 
                  placeholder="Search tickets..." 
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4 ml-auto">
              <Button 
                size="sm" 
                className={hasTicketsToAnalyze ? "bg-primary text-white hover:bg-primary/90" : "bg-gray-100 text-gray-500"}
                onClick={handleAnalyzeTickets}
                disabled={isAnalyzingTickets || !hasTicketsToAnalyze || isAnalyzing}
              >
                {isAnalyzingTickets || isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Tickets
                  </>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2">
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt={userProfile.full_name || 'User'} 
                        className="rounded-full w-8 h-8 object-cover"
                      />
                    ) : (
                      <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-white">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="font-medium">{userProfile?.full_name || 'Loading...'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-0 font-normal"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Sidebar - below header */}
          <div className="flex mt-16 h-[calc(100vh-4rem)]">
            <aside 
              className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] bg-white transition-all duration-300 w-16 hover:w-64 group/sidebar overflow-hidden"
            >
              {/* Navigation */}
              <nav className="p-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isActive 
                          ? "bg-accent text-primary font-medium" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                        {item.label}
                      </span>
                      {item.href === "/jobs" && <ActiveJobsBadge />}
                    </Link>
                  )
                })}
              </nav>
            </aside>
      
            {/* Main Content */}
            <div className="flex-1 ml-16 transition-all duration-300">
              {/* Page Content */}
              <main className="min-h-screen bg-background p-6">
                {children}
              </main>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 