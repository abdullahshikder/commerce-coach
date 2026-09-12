-- Store only privacy-safe facts for admin analytics; questions, answers, and user IDs stay elsewhere.
CREATE TABLE IF NOT EXISTS coach_private.analytics_queries (
 query_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 occurred_on date NOT NULL,
 provider text NOT NULL CHECK(provider IN ('openrouter','gemini')),
 mode text NOT NULL CHECK(mode IN ('normal','training','quiz','troubleshoot','merchant-sim')),
 topics text[] NOT NULL CHECK(cardinality(topics) BETWEEN 1 AND 20)
);
CREATE INDEX IF NOT EXISTS analytics_queries_org_day ON coach_private.analytics_queries(organization_id,occurred_on);

CREATE TABLE IF NOT EXISTS coach_private.analytics_feedback (
 feedback_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 occurred_on date NOT NULL,
 rating text NOT NULL CHECK(rating IN ('helpful','unhelpful')),
 issue_type text,
 status text NOT NULL CHECK(status IN ('recorded','pending','approved','dismissed'))
);
CREATE INDEX IF NOT EXISTS analytics_feedback_org_day ON coach_private.analytics_feedback(organization_id,occurred_on);

CREATE TABLE IF NOT EXISTS coach_private.analytics_failures (
 organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 occurred_on date NOT NULL,
 provider text NOT NULL CHECK(provider IN ('openrouter','gemini')),
 failure_kind text NOT NULL CHECK(failure_kind IN ('not-configured','provider-request','invalid-answer')),
 total bigint NOT NULL CHECK(total >= 0),
 PRIMARY KEY(organization_id,occurred_on,provider,failure_kind)
);
REVOKE ALL ON coach_private.analytics_queries,coach_private.analytics_feedback,coach_private.analytics_failures FROM PUBLIC,coach_app,coach_auth;

CREATE OR REPLACE FUNCTION public.coach_query_analytics_capture() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE captured_topics text[];
BEGIN
 SELECT COALESCE(NULLIF(array_agg(DISTINCT topic ORDER BY topic),ARRAY[]::text[]),ARRAY['General']::text[])
 INTO captured_topics
 FROM (
   SELECT k.domain AS topic
   FROM jsonb_array_elements_text(NEW.retrieval_document_ids) AS item(id)
   JOIN public.coach_knowledge k ON k.id=item.id AND k.active
   UNION ALL
   SELECT 'Uploaded knowledge'
   FROM jsonb_array_elements_text(NEW.retrieval_document_ids) AS item(id)
   WHERE item.id LIKE 'upload:%'
 ) topics;
 INSERT INTO coach_private.analytics_queries(query_id,organization_id,occurred_on,provider,mode,topics)
 VALUES(NEW.id,NEW.organization_id,NEW.created_at::date,NEW.provider,NEW.mode,captured_topics)
 ON CONFLICT(query_id) DO UPDATE SET organization_id=excluded.organization_id,occurred_on=excluded.occurred_on,
 provider=excluded.provider,mode=excluded.mode,topics=excluded.topics;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_query_analytics_capture() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS query_analytics_capture ON public.coach_query_logs;
CREATE TRIGGER query_analytics_capture AFTER INSERT ON public.coach_query_logs
FOR EACH ROW EXECUTE FUNCTION public.coach_query_analytics_capture();

CREATE OR REPLACE FUNCTION public.coach_feedback_analytics_capture() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 INSERT INTO coach_private.analytics_feedback(feedback_id,organization_id,occurred_on,rating,issue_type,status)
 VALUES(NEW.id,NEW.organization_id,NEW.created_at::date,NEW.rating,NEW.issue_type,NEW.status)
 ON CONFLICT(feedback_id) DO UPDATE SET organization_id=excluded.organization_id,occurred_on=excluded.occurred_on,
 rating=excluded.rating,issue_type=excluded.issue_type,status=excluded.status;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_feedback_analytics_capture() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS feedback_analytics_capture ON public.coach_feedback;
CREATE TRIGGER feedback_analytics_capture AFTER INSERT OR UPDATE ON public.coach_feedback
FOR EACH ROW EXECUTE FUNCTION public.coach_feedback_analytics_capture();

-- Repeat deployments safely backfill facts without copying question, answer, comment, or user identity.
SET LOCAL row_security=off;
INSERT INTO coach_private.analytics_queries(query_id,organization_id,occurred_on,provider,mode,topics)
SELECT q.id,q.organization_id,q.created_at::date,q.provider,q.mode,
 COALESCE(NULLIF(ARRAY(
   SELECT DISTINCT topic FROM (
     SELECT k.domain AS topic
     FROM jsonb_array_elements_text(q.retrieval_document_ids) AS item(id)
     JOIN public.coach_knowledge k ON k.id=item.id AND k.active
     UNION ALL
     SELECT 'Uploaded knowledge'
     FROM jsonb_array_elements_text(q.retrieval_document_ids) AS item(id)
     WHERE item.id LIKE 'upload:%'
   ) matched ORDER BY topic
 ),ARRAY[]::text[]),ARRAY['General']::text[])
FROM public.coach_query_logs q
ON CONFLICT(query_id) DO UPDATE SET organization_id=excluded.organization_id,occurred_on=excluded.occurred_on,
 provider=excluded.provider,mode=excluded.mode,topics=excluded.topics;
INSERT INTO coach_private.analytics_feedback(feedback_id,organization_id,occurred_on,rating,issue_type,status)
SELECT id,organization_id,created_at::date,rating,issue_type,status FROM public.coach_feedback
ON CONFLICT(feedback_id) DO UPDATE SET organization_id=excluded.organization_id,occurred_on=excluded.occurred_on,
 rating=excluded.rating,issue_type=excluded.issue_type,status=excluded.status;
SET LOCAL row_security=on;

CREATE OR REPLACE FUNCTION public.coach_record_generation_failure(failure_provider text,failure_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 IF failure_provider NOT IN ('openrouter','gemini') OR failure_reason NOT IN ('not-configured','provider-request','invalid-answer')
 THEN RAISE invalid_parameter_value; END IF;
 INSERT INTO coach_private.analytics_failures AS failures(organization_id,occurred_on,provider,failure_kind,total)
 VALUES(actor.organization_id,current_date,failure_provider,failure_reason,1)
 ON CONFLICT(organization_id,occurred_on,provider,failure_kind)
 DO UPDATE SET total=failures.total+1;
END $$;

CREATE OR REPLACE FUNCTION public.coach_admin_analytics(window_days integer DEFAULT 30) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record; first_day date; result jsonb;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 IF window_days NOT IN (7,30,90) THEN RAISE invalid_parameter_value; END IF;
 first_day:=current_date-(window_days-1);
 SELECT jsonb_build_object(
   'range',jsonb_build_object('days',window_days,'from',first_day,'through',current_date),
   'totals',jsonb_build_object(
     'queries',(SELECT count(*) FROM coach_private.analytics_queries q WHERE q.organization_id=actor.organization_id AND q.occurred_on>=first_day),
     'failures',(SELECT coalesce(sum(f.total),0) FROM coach_private.analytics_failures f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day),
     'feedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day),
     'helpful',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.rating='helpful'),
     'unhelpful',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.rating='unhelpful'),
     'pendingFeedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.status='pending')
   ),
   'trend',(SELECT coalesce(jsonb_agg(jsonb_build_object(
      'date',day::date,
      'queries',(SELECT count(*) FROM coach_private.analytics_queries q WHERE q.organization_id=actor.organization_id AND q.occurred_on=day),
      'failures',(SELECT coalesce(sum(f.total),0) FROM coach_private.analytics_failures f WHERE f.organization_id=actor.organization_id AND f.occurred_on=day),
      'feedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on=day)
    ) ORDER BY day),'[]'::jsonb) FROM generate_series(first_day,current_date,interval '1 day') generated(day)),
   'topics',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',topic,'count',total) ORDER BY total DESC,topic),'[]'::jsonb)
     FROM (SELECT unnest(q.topics) topic,count(*) total FROM coach_private.analytics_queries q
       WHERE q.organization_id=actor.organization_id AND q.occurred_on>=first_day GROUP BY topic ORDER BY total DESC,topic LIMIT 8) ranked),
   'providers',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',provider,'count',total) ORDER BY total DESC,provider),'[]'::jsonb)
     FROM (SELECT q.provider,count(*) total FROM coach_private.analytics_queries q
       WHERE q.organization_id=actor.organization_id AND q.occurred_on>=first_day GROUP BY q.provider) ranked),
   'modes',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',mode,'count',total) ORDER BY total DESC,mode),'[]'::jsonb)
     FROM (SELECT q.mode,count(*) total FROM coach_private.analytics_queries q
       WHERE q.organization_id=actor.organization_id AND q.occurred_on>=first_day GROUP BY q.mode) ranked),
   'failureKinds',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',failure_kind,'count',total) ORDER BY total DESC,failure_kind),'[]'::jsonb)
     FROM (SELECT f.failure_kind,sum(f.total) total FROM coach_private.analytics_failures f
       WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day GROUP BY f.failure_kind) ranked),
   'issues',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',issue,'count',total) ORDER BY total DESC,issue),'[]'::jsonb)
     FROM (SELECT coalesce(f.issue_type,'unspecified') issue,count(*) total FROM coach_private.analytics_feedback f
       WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.rating='unhelpful'
       GROUP BY coalesce(f.issue_type,'unspecified')) ranked)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.coach_record_generation_failure(text,text),public.coach_admin_analytics(integer) FROM PUBLIC,coach_app,coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_record_generation_failure(text,text),public.coach_admin_analytics(integer) TO coach_app;
