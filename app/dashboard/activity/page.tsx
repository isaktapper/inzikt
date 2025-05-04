'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusTag } from '@/components/ui/status-tag';
import { createClientSupabaseClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  status: string;
  date: string;
  count?: number;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this from an API
        // Simulating with demo data based on the screenshots
        
        const supabase = createClientSupabaseClient();
        const { data: tickets } = await supabase
          .from('tickets_with_analysis')
          .select('id, subject, status, created_at, zendesk_created_at, aiTags')
          .order('created_at', { ascending: false })
          .limit(10);
          
        const demoActivities: ActivityItem[] = [
          { id: '1', title: 'Vendor quote comparison', status: 'solved', date: '22/04/2025', count: 1 },
          { id: '2', title: 'Event planning', status: 'solved', date: '22/04/2025', count: 1 },
          { id: '3', title: 'Event planning', status: 'solved', date: '22/04/2025', count: 1 },
          { id: '4', title: 'Participant management', status: 'solved', date: '22/04/2025', count: 1 },
          { id: '5', title: 'Event planning', status: 'solved', date: '22/04/2025', count: 1 },
          { id: '6', title: 'Registration process', status: 'solved', date: '22/04/2025' },
          { id: '7', title: 'Participant management', status: 'solved', date: '17/04/2025', count: 1 },
          { id: '8', title: 'Participant management', status: 'solved', date: '17/04/2025', count: 1 },
          { id: '9', title: 'Vendor selection', status: 'solved', date: '17/04/2025', count: 1 },
          { id: '10', title: 'Participant management', status: 'solved', date: '17/04/2025', count: 1 }
        ];
        
        // If you have real data from tickets, you can transform it here
        // const mappedActivities = (tickets || []).map(...)
        
        setActivities(demoActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Recent Activity</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-3 border-b last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <StatusTag 
                    status={activity.status} 
                    className="w-24 justify-center"
                  />
                  <div className="flex gap-2">
                    <StatusTag 
                      status={activity.title}
                    />
                    {activity.count && (
                      <span className="text-sm text-gray-500">+{activity.count}</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {activity.date}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 