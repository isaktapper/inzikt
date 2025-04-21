// types/ticket.ts

export interface Ticket {
    id: string;
    zendesk_id: string;
    user_id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    requester: string;
    requester_email: string;
    assignee?: string | null;
    group_name?: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
    zendesk_created_at: string;
    zendesk_updated_at: string;
    aiSummary: string | null;
    aiDescription: string | null;
    aiTags: string[];
    aiNewTags: boolean;
    analysis?: any;
    conversation: any[];
  }
  