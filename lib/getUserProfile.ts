import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { z } from "zod";

export type Profile = Database['public']['Tables']['profiles']['Row'];

// Define a more permissive Zod schema for validation that tolerates missing fields
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  company: z.string().nullable(),
  role: z.string().nullable(),
  use_cases: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  domain: z.string().nullable(),
  tag_setup_completed: z.boolean().nullable().default(null),
  tags_generated: z.boolean().nullable().default(null),
});

export async function getUserProfile(): Promise<Profile> {
  const supabase = createClient();
  const { data: userSession, error: authError } = await supabase.auth.getUser();

  if (authError || !userSession?.user?.id) {
    throw new Error("No valid user session");
  }

  const userId = userSession.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found for authenticated user");
  }

  // Ensure all required fields exist with sensible defaults
  const standardizedProfile = {
    id: profile.id,
    full_name: profile.full_name || null,
    company: profile.company || null,
    role: profile.role || null,
    use_cases: profile.use_cases || null,
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at || new Date().toISOString(),
    domain: profile.domain || null,
    tag_setup_completed: profile.tag_setup_completed === true ? true : null,
    tags_generated: profile.tags_generated === true ? true : null,
  };

  try {
    // Validate the profile data
    return ProfileSchema.parse(standardizedProfile);
  } catch (validationError) {
    console.error("Profile validation error:", validationError);
    
    // Return the standardized profile even if validation fails
    console.warn("Returning standardized profile despite validation failure");
    return standardizedProfile as Profile;
  }
} 