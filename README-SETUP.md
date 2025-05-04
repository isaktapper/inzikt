# Setup Guide for Insights Generation

This guide will help you set up the necessary database tables for the insights generation feature.

## 1. Create Required Database Tables

You need to run the following SQL script to create the required job tracking tables:

```bash
# From the Supabase dashboard, navigate to the SQL Editor tab
# Copy and paste the contents of migrations/create_job_tables.sql
# Run the script to create the following tables:
# - import_jobs: tracks one-time jobs like insights generation
# - scheduled_jobs: tracks recurring jobs

# Alternatively, you can run it using the Supabase CLI:
supabase db execute -f migrations/create_job_tables.sql
```

## 2. Verify the Setup

After creating the tables, check if they exist:

```bash
# From the Supabase dashboard, go to the Table Editor
# You should see the import_jobs and scheduled_jobs tables
```

## 3. Test Insights Generation

Once the tables are created, you can test insights generation:

1. Go to the Insights page in your dashboard
2. Click on the "Generate Insights" button
3. The system will create a job and generate insights asynchronously
4. You can track the job status in the import_jobs table

## 4. Configure Automatic Insights

To configure automatic insights generation:

1. Go to the Insights page
2. Click on the Settings tab
3. Enable automatic insights generation and select a frequency
4. The system will automatically generate insights based on your settings

## Troubleshooting

If you encounter issues with insights generation:

- Make sure the import_jobs and scheduled_jobs tables exist
- Check for errors in the API responses
- Verify that you have tickets with analysis data in your database
- Ensure your OpenAI API key is properly configured for AI-powered insights 