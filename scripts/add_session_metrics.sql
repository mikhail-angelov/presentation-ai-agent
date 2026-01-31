-- Add tokens_used and ml_request_count columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ml_request_count INTEGER NOT NULL DEFAULT 0;

-- Update session_stats view to include new metrics
CREATE OR REPLACE VIEW public.session_stats AS
SELECT 
  COUNT(*) AS total_sessions,
  COUNT(CASE WHEN last_accessed > NOW() - INTERVAL '30 minutes' THEN 1 END) AS active_sessions,
  COALESCE(SUM((SELECT COUNT(*) FROM public.user_actions ua WHERE ua.session_id = s.id)), 0) AS total_actions,
  COALESCE(SUM(s.tokens_used), 0) AS total_tokens_used,
  COALESCE(SUM(s.ml_request_count), 0) AS total_ml_requests
FROM public.sessions s;

-- Update recent_sessions view to include new metrics
CREATE OR REPLACE VIEW public.recent_sessions AS
SELECT 
  s.id,
  s.user_id,
  s.created_at,
  s.last_accessed,
  s.user_agent,
  s.ip_address,
  s.tokens_used,
  s.ml_request_count,
  (SELECT COUNT(*) FROM public.user_actions ua WHERE ua.session_id = s.id) AS action_count,
  s.metadata
FROM public.sessions s
ORDER BY s.last_accessed DESC
LIMIT 100;

-- Create a function to increment session metrics
CREATE OR REPLACE FUNCTION public.increment_session_metrics(
  p_session_id UUID,
  p_tokens_used INTEGER DEFAULT 0,
  p_ml_request_count INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.sessions
  SET 
    tokens_used = tokens_used + p_tokens_used,
    ml_request_count = ml_request_count + p_ml_request_count,
    last_accessed = NOW()
  WHERE id = p_session_id;
END;
$$;

-- Create a function to get session metrics
CREATE OR REPLACE FUNCTION public.get_session_metrics(p_session_id UUID)
RETURNS TABLE(
  tokens_used INTEGER,
  ml_request_count INTEGER,
  action_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.tokens_used,
    s.ml_request_count,
    (SELECT COUNT(*) FROM public.user_actions ua WHERE ua.session_id = s.id) AS action_count
  FROM public.sessions s
  WHERE s.id = p_session_id;
END;
$$;