"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Filter, SortDesc, Tag as TagIcon, ExternalLink, ThumbsUp, ThumbsDown, Loader2, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ProductRecommendation {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  confidence_score: number;
  related_tickets: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  price?: string;
  url?: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [supabase] = useState(() => createClientSupabaseClient());
  const [selectedRecommendation, setSelectedRecommendation] = useState<ProductRecommendation | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [activeTab, sortOption]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Select status filter based on active tab
      let statusFilter = undefined;
      if (activeTab === "pending") statusFilter = "pending";
      if (activeTab === "accepted") statusFilter = "accepted";
      if (activeTab === "rejected") statusFilter = "rejected";
      
      // Get user and fetch recommendations
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return;
      }
      
      // Define the query
      let query = supabase
        .from('product_recommendations')
        .select('*')
        .eq('user_id', user.id);
      
      // Apply status filter if needed
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      // Apply sorting
      const orderDirection = sortOption === "oldest" ? { ascending: true } : { ascending: false };
      query = query.order('created_at', orderDirection);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('product_recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setRecommendations(prevRecs => 
        prevRecs.map(rec => 
          rec.id === id ? { ...rec, status } : rec
        )
      );
      
      toast({
        title: status === 'accepted' ? "Recommendation accepted" : "Recommendation rejected",
        description: status === 'accepted' 
          ? "This recommendation has been marked as accepted."
          : "This recommendation has been marked as rejected.",
      });
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      toast({
        title: "Error",
        description: "Failed to update recommendation status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-800';
      case 'improvement':
        return 'bg-green-100 text-green-800';
      case 'fix':
        return 'bg-red-100 text-red-800';
      case 'integration':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  const getConfidenceLevelColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getSortOptionText = () => {
    switch (sortOption) {
      case "newest":
        return "Newest first";
      case "oldest":
        return "Oldest first";
      default:
        return "Sort";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Recommendations</h1>
          <p className="text-gray-500">
            AI-generated product recommendations based on customer feedback
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <SortDesc className="h-4 w-4" />
              <span className="hidden sm:inline">{getSortOptionText()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortOption("newest")}>
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("oldest")}>
              Oldest first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-[280px]">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingBag className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No recommendations found</h3>
          <p className="text-gray-500 mb-4">
            Product recommendations will appear here once your tickets have been analyzed.
          </p>
          <Button 
            variant="outline" 
            className="mx-auto"
            onClick={fetchRecommendations}
          >
            Refresh
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className={getRecommendationTypeColor(recommendation.type)}>
                    {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${getConfidenceLevelColor(recommendation.confidence_score)}`}>
                      {getConfidenceLevel(recommendation.confidence_score)} confidence
                    </span>
                  </div>
                </div>
                <CardTitle className="mt-2 text-base font-bold">{recommendation.title}</CardTitle>
                <CardDescription className="text-xs">
                  Generated {new Date(recommendation.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <p className="text-sm line-clamp-3 mb-2">{recommendation.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {recommendation.tags?.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs py-0 px-2">
                      {tag}
                    </Badge>
                  ))}
                  {recommendation.tags?.length > 3 && (
                    <Badge variant="outline" className="text-xs py-0 px-2">
                      +{recommendation.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex justify-between w-full">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="text-xs flex items-center gap-1"
                        onClick={() => setSelectedRecommendation(recommendation)}
                      >
                        View details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      {selectedRecommendation && (
                        <>
                          <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getRecommendationTypeColor(selectedRecommendation.type)}>
                                {selectedRecommendation.type.charAt(0).toUpperCase() + selectedRecommendation.type.slice(1)}
                              </Badge>
                              <span className={`text-xs font-medium ${getConfidenceLevelColor(selectedRecommendation.confidence_score)}`}>
                                {getConfidenceLevel(selectedRecommendation.confidence_score)} confidence
                              </span>
                            </div>
                            <DialogTitle className="text-xl">{selectedRecommendation.title}</DialogTitle>
                            <DialogDescription>
                              Generated on {new Date(selectedRecommendation.created_at).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 my-2">
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Description</h4>
                              <p className="text-sm">{selectedRecommendation.description}</p>
                            </div>

                            {selectedRecommendation.price && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Estimated Price</h4>
                                <p className="text-sm">{selectedRecommendation.price}</p>
                              </div>
                            )}

                            <div>
                              <h4 className="text-sm font-semibold mb-1">Related Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {selectedRecommendation.tags?.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-1">Based on</h4>
                              <p className="text-sm">
                                {selectedRecommendation.related_tickets.length} related customer tickets
                              </p>
                            </div>

                            {selectedRecommendation.url && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Reference URL</h4>
                                <a 
                                  href={selectedRecommendation.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  Visit reference <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => handleUpdateStatus(selectedRecommendation.id, 'rejected')}
                              disabled={selectedRecommendation.status === 'rejected'}
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(selectedRecommendation.id, 'accepted')}
                              disabled={selectedRecommendation.status === 'accepted'}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>

                  <div className="flex gap-1">
                    {recommendation.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateStatus(recommendation.id, 'rejected')}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateStatus(recommendation.id, 'accepted')}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {recommendation.status === 'accepted' && (
                      <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                    )}
                    {recommendation.status === 'rejected' && (
                      <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 