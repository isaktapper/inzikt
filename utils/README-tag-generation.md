# Automatic Tag Generation System

This system automatically generates support tags after the first ticket import for each user.

## How It Works

1. When users import tickets from Zendesk, the system checks if they already have tags generated.
2. If not, it analyzes the first 100 tickets (ordered by creation date) using OpenAI.
3. The AI generates 15-25 relevant support tags based on the ticket descriptions.
4. These tags are stored in the `user_tags` table and marked as defaults.
5. The user's profile is updated with `tags_generated = true` to prevent regeneration.

## Implementation Details

### Database Tables

- `profiles`: Contains a `tags_generated` boolean field to track if tags have been generated
- `user_tags`: Stores the generated tags with fields:
  - `id`: UUID primary key
  - `user_id`: Reference to the auth.users table
  - `tag_name`: The actual tag text
  - `is_default`: Boolean indicating if this was auto-generated
  - `created_at`: Timestamp of creation

### Key Files

1. `utils/generateUserTagsFromFirstTickets.ts`: The core function that:
   - Fetches the first 100 tickets
   - Calls OpenAI API with the ticket descriptions
   - Parses the response into tags
   - Inserts tags into the database
   - Updates the user's profile

2. `app/api/zendesk/tickets/route.ts`: Modified to check if tags have been generated after ticket import and trigger the generation process if needed.

3. `migrations/add_tags_generated_to_profiles.sql`: Migration that adds the `tags_generated` column to profiles and creates the `user_tags` table if it doesn't exist.

### OpenAI Prompt

The AI is prompted to generate tags that:
- Are 1-3 words long
- Are specific and relevant
- Avoid generic words like 'issue', 'problem', 'question'
- Avoid duplicates or vague terms

## Usage

No user action is required. The system automatically runs after the first ticket import.

Tags will appear in the Tags dashboard section once generated. 