# Supabase Session Storage Setup

## Overview
The application now stores all session information and metrics in Supabase instead of using in-memory storage. This provides persistent storage, better scalability, and allows for analytics and monitoring.

## Database Schema

The following tables and views have been created:

### Tables
1. **sessions** - Stores session information
   - `id` (UUID, PRIMARY KEY): Unique session identifier (auto-generated)
   - `user_id` (TEXT): Optional user identifier
   - `created_at` (TIMESTAMP): When the session was created
   - `last_accessed` (TIMESTAMP): Last time the session was accessed
   - `user_agent` (TEXT): Browser/user agent information
   - `ip_address` (TEXT): Client IP address
   - `metadata` (JSONB): Additional session metadata
   - `expires_at` (TIMESTAMP): Auto-generated expiry date (7 days from creation)

2. **user_actions** - Stores individual user actions within sessions
   - `id` (UUID, PRIMARY KEY): Unique action identifier (auto-generated)
   - `session_id` (UUID, FOREIGN KEY): Reference to sessions table
   - `type` (TEXT): Type of action (e.g., "generate_outline", "create_slides")
   - `timestamp` (TIMESTAMP): When the action occurred
   - `endpoint` (TEXT): API endpoint called
   - `data` (JSONB): Input data for the action
   - `result` (JSONB): Result data from the action
   - `tokens_used` (INTEGER): AI tokens consumed
   - `duration_ms` (INTEGER): How long the action took

### Views
1. **session_stats** - Provides aggregated statistics
   - `total_sessions`: Total number of sessions
   - `active_sessions`: Sessions active in last 30 minutes
   - `total_actions`: Total number of actions across all sessions

2. **recent_sessions** - Shows recent sessions with action counts
   - Includes all session fields plus `action_count`

### Indexes
- `idx_sessions_user_id`: For querying sessions by user
- `idx_sessions_last_accessed`: For sorting and filtering by activity
- `idx_sessions_expires_at`: For automatic cleanup
- `idx_user_actions_session_id`: For querying actions by session
- `idx_user_actions_timestamp`: For time-based queries
- `idx_user_actions_type`: For filtering by action type

### Functions
- `cleanup_expired_sessions()`: Automatically deletes sessions older than 7 days

## Setup Instructions

### 1. Create Supabase Database Schema

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of scripts/create_sessions_schema.sql
-- into the Supabase SQL Editor and run it
```

Or use the provided migration script:

```bash
# Make sure environment variables are set
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"

# Run the migration script
node scripts/run_supabase_migration.js
```

### 2. Environment Variables

Make sure these environment variables are set in your `.env` and `.env.prod` files:

```bash
# Supabase Configuration
SUPABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Verify the Setup

1. **Check tables are created**: Go to Supabase Dashboard → Table Editor
2. **Test session creation**: Use the application to create a presentation
3. **Verify data persistence**: Restart the application and check if sessions persist

## API Changes

The session API (`/api/sessions`) now uses Supabase instead of in-memory storage:

- **POST /api/sessions**: Creates a new session in Supabase
- **GET /api/sessions**: Retrieves session from Supabase
- **PUT /api/sessions**: Updates session with new actions/metadata
- **DELETE /api/sessions**: Deletes session from Supabase
- **OPTIONS /api/sessions**: Gets session statistics (admin endpoint)

## Benefits

1. **Persistence**: Sessions survive application restarts
2. **Scalability**: Can handle more concurrent users
3. **Analytics**: Rich data for user behavior analysis
4. **Monitoring**: Track AI usage, popular features, etc.
5. **Backup**: Database backups ensure data safety

## Monitoring and Analytics

Use the Supabase dashboard or connect BI tools to analyze:

1. **User engagement**: Session duration, frequency
2. **Feature usage**: Most used AI features
3. **Performance metrics**: Response times, error rates
4. **AI usage**: Token consumption patterns
5. **Geographic distribution**: User locations

## Troubleshooting

### Common Issues

1. **Connection errors**: Check SUPABASE_URL and SUPABASE_ANON_KEY
2. **Missing tables**: Run the SQL migration script
3. **Permission errors**: Ensure tables have proper RLS policies
4. **Performance issues**: Check database indexes

### Debugging

Check application logs for Supabase errors:

```bash
# Development mode shows detailed errors
npm run dev

# Check browser console for client-side errors
# Check server logs for API errors
```

## Security Considerations

1. **Row Level Security (RLS)**: Consider enabling RLS for production
2. **API Keys**: Keep SUPABASE_ANON_KEY secure
3. **Data Privacy**: Ensure PII is handled appropriately
4. **Backup Strategy**: Regular database backups

## Future Enhancements

1. **Real-time updates**: Use Supabase Realtime for live updates
2. **Advanced analytics**: Connect to data visualization tools
3. **User authentication**: Integrate Supabase Auth
4. **Automated reports**: Scheduled analytics reports
5. **Alerting**: Notifications for unusual activity