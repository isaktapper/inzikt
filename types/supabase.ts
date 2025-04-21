export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          zendesk_id: number;
          subject: string;
          status: string;
          priority: string;
          requester: string;
          requester_email: string;
          assignee: string | null;
          group_name: string | null;
          tags: string[];
          summary: string | null;
          detailed_description: string | null;
          suggested_tags: string[] | null;
          ai_model: string | null;
          processing_time: number | null;
          confidence_score: number | null;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company: string | null;
          role: string | null;
          use_cases: string[] | null;
          created_at: string;
          updated_at: string;
          domain: string | null;
          tag_setup_completed: boolean | null;
          tags_generated: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
} 