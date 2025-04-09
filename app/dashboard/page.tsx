"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Tag,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Sample data
const insights = [
  {
    title: "Feature Requests",
    description: "Users are requesting better search functionality",
    tags: ["Feature Request", "Search"],
    count: 24,
    trend: "+12%",
  },
  {
    title: "Bug Reports",
    description: "Mobile app crashes on Android devices",
    tags: ["Bug", "Mobile"],
    count: 18,
    trend: "-5%",
  },
  {
    title: "Positive Feedback",
    description: "Users love the new dashboard design",
    tags: ["Positive"],
    count: 42,
    trend: "+28%",
  },
  {
    title: "Onboarding Issues",
    description: "Users struggle with account verification",
    tags: ["Onboarding", "UX"],
    count: 15,
    trend: "0%",
  },
]

const tickets = [
  {
    id: "TKT-1234",
    summary: "Can't find the search button after update",
    tags: ["UI", "Search"],
    date: "2 hours ago",
  },
  {
    id: "TKT-1233",
    summary: "App crashes when uploading large files",
    tags: ["Bug", "Upload"],
    date: "5 hours ago",
  },
  {
    id: "TKT-1232",
    summary: "Love the new dashboard design!",
    tags: ["Positive", "UI"],
    date: "Yesterday",
  },
  {
    id: "TKT-1231",
    summary: "Need help with API integration",
    tags: ["API", "Integration"],
    date: "2 days ago",
  },
  {
    id: "TKT-1230",
    summary: "Feature request: dark mode support",
    tags: ["Feature Request", "UI"],
    date: "3 days ago",
  },
]

export default function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="flex items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-[#d8f950] p-1">
                <span className="font-bold text-black">K</span>
              </div>
              <span className="font-bold text-xl">KISA</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard">
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Insights">
                  <BarChart3 className="h-5 w-5" />
                  <span>Insights</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Tickets">
                  <MessageSquare className="h-5 w-5" />
                  <span>Tickets</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Tags">
                  <Tag className="h-5 w-5" />
                  <span>Tags</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Mobile menu */}
        <div
          className={`fixed inset-0 z-50 bg-black/50 ${mobileMenuOpen ? "block" : "hidden"} md:hidden`}
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:hidden`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-[#d8f950] p-1">
                <span className="font-bold text-black">K</span>
              </div>
              <span className="font-bold text-xl">KISA</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <nav className="space-y-4">
              <Link href="#" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                <BarChart3 className="h-5 w-5" />
                <span>Insights</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                <MessageSquare className="h-5 w-5" />
                <span>Tickets</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                <Tag className="h-5 w-5" />
                <span>Tags</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <SidebarTrigger className="hidden md:flex" />
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 h-9 bg-gray-50 border-gray-200 focus-visible:ring-[#d8f950]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-[#d8f950] text-black text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    3
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <div className="bg-[#d8f950] rounded-full w-8 h-8 flex items-center justify-center font-bold text-black">
                        I
                      </div>
                      <span className="hidden md:inline-block font-medium">Isak</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Dashboard content */}
          <main className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold">Hey Isak 👋</h1>
                <p className="text-gray-600">Here's what's happening with your support tickets</p>
              </div>
              <Button className="bg-[#d8f950] text-black hover:bg-[#c2e340]">
                <Plus className="mr-2 h-4 w-4" /> Analyze new tickets
              </Button>
            </div>

            {/* Insights cards */}
            <h2 className="text-lg font-medium mb-4">Latest Insights</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium">{insight.title}</h3>
                      <span
                        className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                          insight.trend.startsWith("+")
                            ? "bg-green-50 text-green-700"
                            : insight.trend.startsWith("-")
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {insight.trend}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{insight.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {insight.tags.map((tag, j) => (
                        <span key={j} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border-t p-4 flex justify-between items-center mt-auto">
                    <span className="text-sm font-medium">{insight.count} tickets</span>
                    <Button variant="ghost" size="sm" className="text-xs hover:bg-[#d8f950]/10 hover:text-black">
                      View details
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tickets table */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent Tickets</h2>
              <Button variant="outline" size="sm">
                View all
              </Button>
            </div>
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-sm">Ticket ID</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Summary</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Tags</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, i) => (
                      <tr key={i} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{ticket.id}</td>
                        <td className="py-3 px-4 text-sm">{ticket.summary}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {ticket.tags.map((tag, j) => (
                              <span key={j} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{ticket.date}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
