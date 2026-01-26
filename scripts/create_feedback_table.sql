-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'recommendation', 'issue')),
  message TEXT NOT NULL,
  email TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_resolved ON user_feedback(resolved);
CREATE INDEX IF NOT EXISTS idx_user_feedback_session_id ON user_feedback(session_id);

-- Create a view for feedback statistics
CREATE OR REPLACE VIEW feedback_stats AS
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN type = 'feedback' THEN 1 END) as feedback_count,
  COUNT(CASE WHEN type = 'recommendation' THEN 1 END) as recommendation_count,
  COUNT(CASE WHEN type = 'issue' THEN 1 END) as issue_count,
  COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_count,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as feedback_with_email
FROM user_feedback;

-- Create a view for recent feedback
CREATE OR REPLACE VIEW recent_feedback AS
SELECT 
  id,
  type,
  message,
  email,
  session_id,
  created_at,
  resolved,
  resolved_at
FROM user_feedback
ORDER BY created_at DESC
LIMIT 100;

-- Create a function to automatically mark old feedback as resolved
CREATE OR REPLACE FUNCTION auto_resolve_old_feedback()
RETURNS void AS $$
BEGIN
  UPDATE user_feedback 
  SET resolved = true, 
      resolved_at = NOW(),
      resolved_by = 'system',
      notes = 'Automatically resolved after 30 days'
  WHERE resolved = false 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;