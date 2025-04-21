"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Home,
  Tag,
  MessageSquare,
  Bell,
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
  { href: "/dashboard/tags", icon: Tag, label: "Tags" },
]

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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
      // Start the progress tracking
      startAnalysis(userProfile.id);
      
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
    <div className="flex min-h-screen bg-background">
      {/* Only render content when loading is complete */}
      {loading ? (
        <div className="flex items-center justify-center w-full min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Tag Setup Modal */}
          <TagSetupModal />
          
          {/* Sidebar */}
          <aside 
            className={cn(
              "fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300",
              isSidebarCollapsed ? "w-20" : "w-64"
            )}
          >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b">
              <Link href="/" className="flex items-center gap-2">
                {/* Logo logic for Inzikt */}
                {isSidebarCollapsed ? (
                  <img src="/inzikt_icon.svg" alt="Inzikt Icon" className="h-12 w-12" style={{ filter: 'brightness(0) saturate(100%) invert(41%) sepia(94%) saturate(749%) hue-rotate(202deg) brightness(99%) contrast(101%)' }} />
                ) : (
                  <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-12 w-12" style={{ filter: 'brightness(0) saturate(100%) invert(41%) sepia(94%) saturate(749%) hue-rotate(202deg) brightness(99%) contrast(101%)' }} />
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
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
                    {!isSidebarCollapsed && (
                      <span>{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </aside>
    
          {/* Main Content */}
          <div className={cn(
            "flex-1 transition-all duration-300",
            isSidebarCollapsed ? "ml-20" : "ml-64"
          )}>
            {/* Top Bar */}
            <header className="fixed top-0 right-0 z-30 h-16 border-b bg-white flex items-center justify-between px-6 gap-4"
              style={{ width: `calc(100% - ${isSidebarCollapsed ? "5rem" : "16rem"})` }}
            >
              {/* Search */}
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="search" 
                    placeholder="Search tickets..." 
                    className="w-full pl-10"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
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
                
                {/* Jobs Dropdown */}
                <JobsDropdown />
                
                <button className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    3
                  </span>
                </button>

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
                      {!isSidebarCollapsed && (
                        <>
                          <span className="font-medium">{userProfile?.full_name || 'Loading...'}</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
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

            {/* Page Content */}
            <main className="pt-16 min-h-screen bg-background">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  )
} 