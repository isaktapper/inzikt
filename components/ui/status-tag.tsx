import React from 'react';
import { cn } from '@/lib/utils';

interface StatusTagProps {
  status: string;
  count?: number;
  date?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatusTag({ status, count, date, className, children }: StatusTagProps) {
  // Define styles for different statuses
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'solved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'event planning':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'registration process':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'vendor quote comparison':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'participant management':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'support feedback':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'communication tools':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'vendor selection':
        return 'bg-rose-100 text-rose-800 border-rose-200'; 
      case 'compliance management':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
      getStatusStyles(),
      className
    )}>
      {status}
      {count !== undefined && (
        <span className="ml-1.5 bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs">
          +{count}
        </span>
      )}
      {date && (
        <span className="ml-1.5 text-xs opacity-80">
          {date}
        </span>
      )}
      {children}
    </div>
  );
} 