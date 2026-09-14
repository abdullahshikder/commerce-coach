CREATE OR REPLACE FUNCTION public.coach_admin_analytics(window_days integer DEFAULT 30) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record; first_day date; previous_first_day date; previous_last_day date; result jsonb;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 IF window_days NOT IN (7,30,90) THEN RAISE invalid_parameter_value; END IF;
 first_day:=current_date-(window_days-1);
 previous_last_day:=first_day-1;
 previous_first_day:=previous_last_day-(window_days-1);
 SELECT jsonb_build_object(
   'range',jsonb_build_object(
     'days',window_days,'from',first_day,'through',current_date,
     'previousFrom',previous_first_day,'previousThrough',previous_last_day
   ),
   'totals',jsonb_build_object(
     'queries',(SELECT count(*) FROM coach_private.analytics_queries q WHERE q.organization_id=actor.organization_id AND q.occurred_on>=first_day),
     -- General is the capture trigger's explicit fallback when no built-in or uploaded knowledge was retrieved.
     'groundedQueries',(SELECT count(*) FROM coach_private.analytics_queries q WHERE q.organization_id=actor.organization_id AND q.occurred_on>=first_day AND q.topics<>ARRAY['General']::text[]),
     'failures',(SELECT coalesce(sum(f.total),0) FROM coach_private.analytics_failures f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day),
     'feedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day),
     'helpful',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.rating='helpful'),
     'unhelpful',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.rating='unhelpful'),
     'pendingFeedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.status='pending')
   ),
   'previousTotals',jsonb_build_object(
     'queries',(SELECT count(*) FROM coach_private.analytics_queries q WHERE q.organization_id=actor.organization_id AND q.occurred_on BETWEEN previous_first_day AND previous_last_day),
     'groundedQueries',(SELECT count(*) FROM coach_private.analytics_queries q WHERE q.organization_id=actor.organization_id AND q.occurred_on BETWEEN previous_first_day AND previous_last_day AND q.topics<>ARRAY['General']::text[]),
     'failures',(SELECT coalesce(sum(f.total),0) FROM coach_private.analytics_failures f WHERE f.organization_id=actor.organization_id AND f.occurred_on BETWEEN previous_first_day AND previous_last_day),
     'feedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on BETWEEN previous_first_day AND previous_last_day),
     'helpful',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on BETWEEN previous_first_day AND previous_last_day AND f.rating='helpful'),
     'unhelpful',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on BETWEEN previous_first_day AND previous_last_day AND f.rating='unhelpful'),
     'pendingFeedback',(SELECT count(*) FROM coach_private.analytics_feedback f WHERE f.organization_id=actor.organization_id AND f.occurred_on BETWEEN previous_first_day AND previous_last_day AND f.status='pending')
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
       WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day GROUP BY failure_kind) ranked),
   'issues',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',issue,'count',total) ORDER BY total DESC,issue),'[]'::jsonb)
     FROM (SELECT coalesce(f.issue_type,'unspecified') issue,count(*) total FROM coach_private.analytics_feedback f
       WHERE f.organization_id=actor.organization_id AND f.occurred_on>=first_day AND f.rating='unhelpful'
       GROUP BY coalesce(f.issue_type,'unspecified')) ranked)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.coach_admin_analytics(integer) FROM PUBLIC,coach_app,coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_admin_analytics(integer) TO coach_app;
