"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Check, Pencil, X, AlertTriangle } from "lucide-react";
import { createClientSupabaseClient } from "@/utils/supabase/client";
import { getUserProfile } from "@/lib/getUserProfile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

// Default system tags in case user skips
const DEFAULT_SYSTEM_TAGS = [
  { tag_name: "login_issue", description: "Problems with logging into the system" },
  { tag_name: "password_reset", description: "Requests to reset forgotten passwords" },
  { tag_name: "account_creation", description: "Issues with creating new accounts" },
  { tag_name: "billing", description: "Questions about invoices and payments" },
  { tag_name: "subscription", description: "Issues with subscription plans or renewals" },
  { tag_name: "feature_request", description: "Suggestions for new features" },
  { tag_name: "bug", description: "Reports of software bugs or errors" },
  { tag_name: "performance", description: "Issues with system speed or responsiveness" },
  { tag_name: "data_import", description: "Problems importing data into the system" },
  { tag_name: "data_export", description: "Issues exporting data from the system" },
  { tag_name: "integration", description: "Problems with third-party integrations" },
  { tag_name: "mobile_app", description: "Issues specific to mobile applications" },
  { tag_name: "ui_ux", description: "Feedback about user interface and experience" },
  { tag_name: "documentation", description: "Questions about product documentation" },
  { tag_name: "api", description: "Problems with API usage or documentation" },
  { tag_name: "onboarding", description: "Issues during the new user onboarding process" },
  { tag_name: "security", description: "Security concerns or incidents" },
  { tag_name: "compliance", description: "Questions about regulatory compliance" },
  { tag_name: "settings", description: "Problems with system configuration" },
  { tag_name: "user_permissions", description: "Issues with role-based access control" },
];

interface Tag {
  tag_name: string;
  description: string;
  selected?: boolean;
  isCustom?: boolean;
}

const loadingTexts = [
  "Analyzing your website…",
  "Listening to your customers…",
  "Crafting your perfect tag system…",
  "Reading your website content…",
  "Finding the right categories…",
  "Building your support taxonomy…",
  "Extracting relevant keywords…",
  "Creating smart tag suggestions…",
  "Tailoring to your business needs…"
];

interface TagSetupModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function TagSetupModal({ isOpen, onClose }: TagSetupModalProps) {
  const [open, setOpen] = useState(isOpen || false);
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingTexts[0]);
  const [error, setError] = useState("");
  const [supabase] = useState(() => createClientSupabaseClient());
  const [step, setStep] = useState<"input" | "tags" | "confirmation">("input");
  const [tags, setTags] = useState<Tag[]>([]);
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  
  // Custom tag form
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  
  // Toast notifications
  const { toast } = useToast();
  
  // Update open state when props change
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);
  
  // Update the function to check if the modal should be shown
  useEffect(() => {
    // Skip this check if the component is controlled externally
    if (isOpen !== undefined) return;
    
    const checkTagSetupStatus = async () => {
      try {
        // Get user profile using the helper function
        const profile = await getUserProfile();
        
        // Check if user has any tags already set up
        const { data: userTags, error: tagsError } = await supabase
          .from('user_tags')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1);
          
        if (tagsError) {
          console.error("Error checking user tags:", tagsError);
          return;
        }
        
        // If user already has tags, don't show the modal
        if (userTags && userTags.length > 0) {
          console.log("User already has tags, not showing modal");
          return;
        }
        
        // Check if user has any tickets
        const { count, error: ticketError } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id);
          
        if (ticketError) {
          console.error("Error checking tickets:", ticketError);
          return;
        }
        
        // MODIFICATION: Only show for new users with no tickets 
        // or when explicitly requested through the isOpen prop
        // DO NOT show automatically when analyzing tickets
        if (count === 0 && !isOpen) {
          setOpen(true);
          
          // If they already have a domain, pre-fill it
          if (profile && profile.domain) {
            setWebsite(profile.domain);
          }
        }
      } catch (error) {
        console.error("Error checking tag setup status:", error);
        setError("Could not fetch your user profile. Please try logging out and in again or contact support.");
      }
    };
    
    checkTagSetupStatus();
  }, [supabase, isOpen]);
  
  // Function to rotate loading texts
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  // Function to handle website submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (!website.trim()) {
      setError("Please enter your company website");
      return;
    }
    
    // Format domain - extract just the domain part
    let domain = website.trim();
    try {
      // Remove protocol and path if present
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        domain = new URL(domain).hostname;
      } else if (domain.includes('/')) {
        // If no protocol but has path, treat as hostname/path
        domain = domain.split('/')[0];
      }
      
      // Remove www. if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
    } catch (error) {
      setError("Invalid website URL. Please enter a valid domain.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the user profile
      const profile = await getUserProfile();
      
      // Save the domain to the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ domain })
        .eq('id', profile.id);
        
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;
      
      if (!authToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      // Call the API to generate tags based on the domain
      const response = await fetch('/api/generate-tags-from-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ domain }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate tags');
      }
      
      // Get the response data
      const data = await response.json();
      
      // Process tags
      const processedTags = data.tags.map((tag: Tag) => ({
        ...tag,
        selected: true, // All tags are initially selected
        isCustom: false
      }));
      
      setTags(processedTags);
      
      // Move to tag selection step
      setStep("tags");
    } catch (error) {
      console.error("Error generating tags:", error);
      setError(error instanceof Error ? error.message : "Failed to generate tags");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to toggle tag selection
  const toggleTagSelection = (index: number) => {
    const updatedTags = [...tags];
    updatedTags[index].selected = !updatedTags[index].selected;
    setTags(updatedTags);
  };
  
  // Function to add a custom tag
  const handleAddCustomTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Tag name required",
        description: "Please enter a name for your custom tag",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicate names
    if (tags.some(tag => tag.tag_name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast({
        title: "Duplicate tag",
        description: "A tag with this name already exists",
        variant: "destructive",
      });
      return;
    }
    
    const newTag: Tag = {
      tag_name: newTagName.trim(),
      description: newTagDescription.trim() || "Custom tag",
      selected: true,
      isCustom: true
    };
    
    setTags([...tags, newTag]);
    setNewTagName("");
    setNewTagDescription("");
    
    toast({
      title: "Custom tag added",
      description: "Your custom tag has been added to the list",
    });
  };
  
  // Function to save selected tags
  const handleSaveTags = async () => {
    const selectedTags = tags.filter(tag => tag.selected);
    
    if (selectedTags.length === 0) {
      toast({
        title: "No tags selected",
        description: "Please select at least one tag or skip the setup",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const profile = await getUserProfile();
      
      // Save selected tags to user_tags table
      const insertPromises = selectedTags.map(tag => {
        return supabase
          .from('user_tags')
          .upsert({
            user_id: profile.id,
            tag_name: tag.tag_name,
            is_default: !tag.isCustom || false
          }, {
            onConflict: 'user_id,tag_name',
            ignoreDuplicates: false
          });
      });
      
      const results = await Promise.all(insertPromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        // Log more detailed error information
        errors.forEach((err, index) => {
          console.error(`Tag save error ${index + 1}:`, {
            message: err.error?.message,
            details: err.error?.details,
            hint: err.error?.hint,
            code: err.error?.code
          });
        });
        
        // Log the error but continue with successfully saved tags
        toast({
          title: "Some tags failed to save",
          description: `${errors.length} tags couldn't be saved, but ${selectedTags.length - errors.length} were saved successfully`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tags saved successfully",
          description: `${selectedTags.length} tags have been saved to your account`,
        });
      }
      
      // Close the modal
      handleClose();
    } catch (error) {
      console.error("Error saving tags:", error);
      setError(error instanceof Error ? error.message : "Failed to save tags");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to skip tag setup
  const handleSkip = async () => {
    setConfirmSkipOpen(false);
    setIsLoading(true);
    
    try {
      const profile = await getUserProfile();
      
      // Insert default system tags
      const insertPromises = DEFAULT_SYSTEM_TAGS.map(tag => {
        return supabase
          .from('user_tags')
          .upsert({
            user_id: profile.id,
            tag_name: tag.tag_name,
            is_default: true
          }, {
            onConflict: 'user_id,tag_name',
            ignoreDuplicates: false
          });
      });
      
      await Promise.all(insertPromises);
      
      toast({
        title: "Setup skipped",
        description: "Default system tags have been added to your account",
      });
      
      // Close the dialog
      setConfirmSkipOpen(false);
      handleClose();
    } catch (error) {
      console.error("Error skipping tag setup:", error);
      setError("Could not fetch your user profile. Please try logging out and in again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render different steps of the modal
  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          
          <div className="text-center space-y-3">
            <p className="text-xl font-medium">{loadingText}</p>
            <p className="text-sm text-gray-500">This will just take a moment...</p>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
      );
    }
    
    if (step === "input") {
      return (
        <div className="space-y-4">
          <DialogTitle className="text-xl font-bold text-center">Set up your support tags</DialogTitle>
          <DialogDescription className="text-center">
            We'll analyze your website to suggest relevant support tags
          </DialogDescription>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">
                What's your company's website?
              </Label>
              <Input
                id="website"
                placeholder="www.example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                We'll scan your homepage and generate smart support tags just for you 💡
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <div className="flex flex-col space-y-2 pt-2">
              <Button type="submit">Generate tags</Button>
              <Button variant="ghost" type="button" onClick={() => setConfirmSkipOpen(true)}>
                Skip for now
              </Button>
            </div>
          </form>
        </div>
      );
    }
    
    if (step === "tags") {
      return (
        <div className="space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
          <DialogTitle className="text-xl font-bold">Choose your support tags</DialogTitle>
          <DialogDescription>
            Select the tags that best match your support categories. All tags are selected by default.
          </DialogDescription>
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <div className="overflow-y-auto pr-2 space-y-4 flex-1">
            <div className="space-y-2">
              <h3 className="font-medium">Suggested Tags</h3>
              <div className="border rounded-md divide-y">
                {tags.filter(tag => !tag.isCustom).map((tag, index) => (
                  <div key={`suggested-${index}`} className="p-3 flex items-start space-x-3">
                    <Checkbox 
                      id={`tag-${index}`}
                      checked={tag.selected}
                      onCheckedChange={() => toggleTagSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`tag-${index}`}
                        className="font-medium cursor-pointer"
                      >
                        {tag.tag_name}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {tag.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {tags.some(tag => tag.isCustom) && (
              <div className="space-y-2">
                <h3 className="font-medium">Custom Tags</h3>
                <div className="border rounded-md divide-y">
                  {tags.filter(tag => tag.isCustom).map((tag, index) => (
                    <div key={`custom-${index}`} className="p-3 flex items-start space-x-3">
                      <Checkbox 
                        id={`custom-tag-${index}`}
                        checked={tag.selected}
                        onCheckedChange={() => toggleTagSelection(tags.findIndex(t => t.tag_name === tag.tag_name))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`custom-tag-${index}`}
                          className="font-medium cursor-pointer"
                        >
                          {tag.tag_name}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {tag.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium flex items-center">
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Tag
              </h3>
              <div className="space-y-3 p-3 border rounded-md">
                <div>
                  <Label htmlFor="newTagName" className="text-sm mb-1 block">
                    Tag Name (Required)
                  </Label>
                  <Input
                    id="newTagName"
                    placeholder="Enter tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div>
                  <Label htmlFor="newTagDescription" className="text-sm mb-1 block">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="newTagDescription"
                    placeholder="Describe what this tag is for"
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    maxLength={100}
                    rows={2}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddCustomTag}
                  disabled={!newTagName.trim()}
                  className="w-full"
                >
                  Add Custom Tag
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4 flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={() => setConfirmSkipOpen(true)}
            >
              Skip Setup
            </Button>
            <Button 
              onClick={handleSaveTags}
              disabled={tags.filter(tag => tag.selected).length === 0}
            >
              Save {tags.filter(tag => tag.selected).length} Tags
            </Button>
          </DialogFooter>
        </div>
      );
    }
    
    return null;
  };
  
  // Update the handle close function to handle refreshing when tags were saved
  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
    
    // If we've completed tag setup, refresh the page to show the new tags
    if (step === "confirmation") {
      // Small delay to allow the modal to close smoothly
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen && onClose) {
          onClose();
        }
      }}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          {renderStep()}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={confirmSkipOpen} onOpenChange={setConfirmSkipOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Skip Tag Setup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? We recommend generating your own tags for the best analysis results. 
              If you skip, our standard tag library will be used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkip}>
              Yes, Skip Setup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 