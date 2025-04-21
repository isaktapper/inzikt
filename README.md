## Setting Up Integrations

The application supports integrating with third-party services like Zendesk, Intercom, and Freshdesk. To make this feature work properly, you need to set up the required database table:

1. Run the migration script to create the integration_connections table:

```bash
node scripts/run-migrations.js
```

2. When prompted, select `integration_connections.sql` or type `all` to run all migrations.

This will create the necessary database table and set up the row-level security policies to ensure data remains secure. 

# Import Progress Indicator

This document explains how to use the new ImportProgressIndicator component that shows the progress of importing tickets from external integrations.

## Features

The ImportProgressIndicator shows:
- Different stages of import: Scanning, Processing, and Importing
- Progress percentage and ticket counts
- Completion or failure status
- Auto-dismisses after completion

## Usage

```tsx
import { ImportProgressIndicator } from '@/components/ImportProgressIndicator';

// In your component
{activeImportJob && (
  <ImportProgressIndicator 
    jobId={activeImportJob.id}
    onComplete={() => {
      // Handle completion, such as resetting state or refreshing data
      setActiveImportJob(null);
    }}
  />
)}
```

## How it Works

The component connects to the `/api/import-progress` endpoint, which maps job status to different stages of the import process:

1. **Scanning** (0-25% progress): Initial phase where tickets are being discovered
2. **Processing** (25-75% progress): Middle phase where tickets are being prepared
3. **Importing** (75-100% progress): Final phase where tickets are being written to the database

The progress indicator will automatically dismiss itself 5 seconds after the import completes.

## API Details

The `/api/import-progress` endpoint accepts a `jobId` parameter and returns a progress object with the following properties:

```typescript
{
  jobId: string;
  provider: 'zendesk' | 'intercom' | 'freshdesk';
  stage: 'scanning' | 'processing' | 'importing' | 'completed' | 'failed';
  totalTickets: number;
  processedCount: number;
  percentage: number;
  isCompleted: boolean;
}
``` 