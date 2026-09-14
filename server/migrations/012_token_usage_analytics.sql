-- Privacy-safe daily aggregates of provider-reported token usage. No prompts, responses, or user IDs are retained.
CREATE TABLE IF NOT EXISTS coach_private.analytics_token_usage (
 organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 occurred_on date NOT NULL,
 provider text NOT NULL CHECK(provider IN ('openrouter','gemini')),
 phase text NOT NULL CHECK(phase IN ('understanding','generation','answer-review','visual-review')),
 input_tokens bigint NOT NULL DEFAULT 0 CHECK(input_tokens >= 0),
 output_tokens bigint NOT NULL DEFAULT 0 CHECK(output_tokens >= 0),
 PRIMARY KEY(organization_id,occurred_on,provider,phase)
);
CREATE INDEX IF NOT EXISTS analytics_token_usage_org_day ON coach_private.analytics_token_usage(organization_id,occurred_on);
REVOKE ALL ON coach_private.analytics_token_usage FROM PUBLIC,coach_app,coach_auth;

CREATE OR REPLACE FUNCTION public.coach_record_token_usage(usage_provider text, usage_phase text, input_count bigint, output_count bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 IF usage_provider NOT IN ('openrouter','gemini') OR usage_phase NOT IN ('understanding','generation','answer-review','visual-review')
    OR input_count < 0 OR output_count < 0 OR input_count > 100000000 OR output_count > 100000000 THEN RAISE invalid_parameter_value; END IF;
 INSERT INTO coach_private.analytics_token_usage AS usage(organization_id,occurred_on,provider,phase,input_tokens,output_tokens)
 VALUES(actor.organization_id,current_date,usage_provider,usage_phase,input_count,output_count)
 ON CONFLICT(organization_id,occurred_on,provider,phase)
 DO UPDATE SET input_tokens=usage.input_tokens+excluded.input_tokens,output_tokens=usage.output_tokens+excluded.output_tokens;
END $$;
REVOKE ALL ON FUNCTION public.coach_record_token_usage(text,text,bigint,bigint) FROM PUBLIC,coach_app,coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_record_token_usage(text,text,bigint,bigint) TO coach_app;

CREATE OR REPLACE FUNCTION public.coach_admin_token_usage(window_days integer DEFAULT 30) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record; first_day date; previous_first_day date; previous_last_day date;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 IF window_days NOT IN (7,30,90) THEN RAISE invalid_parameter_value; END IF;
 first_day:=current_date-(window_days-1);
 previous_last_day:=first_day-1;
 previous_first_day:=previous_last_day-(window_days-1);
 RETURN jsonb_build_object(
   'totals',jsonb_build_object(
     'inputTokens',(SELECT coalesce(sum(input_tokens),0) FROM coach_private.analytics_token_usage usage WHERE usage.organization_id=actor.organization_id AND usage.occurred_on>=first_day),
     'outputTokens',(SELECT coalesce(sum(output_tokens),0) FROM coach_private.analytics_token_usage usage WHERE usage.organization_id=actor.organization_id AND usage.occurred_on>=first_day),
     'totalTokens',(SELECT coalesce(sum(input_tokens+output_tokens),0) FROM coach_private.analytics_token_usage usage WHERE usage.organization_id=actor.organization_id AND usage.occurred_on>=first_day)
   ),
   'previousTotals',jsonb_build_object(
     'inputTokens',(SELECT coalesce(sum(input_tokens),0) FROM coach_private.analytics_token_usage usage WHERE usage.organization_id=actor.organization_id AND usage.occurred_on BETWEEN previous_first_day AND previous_last_day),
     'outputTokens',(SELECT coalesce(sum(output_tokens),0) FROM coach_private.analytics_token_usage usage WHERE usage.organization_id=actor.organization_id AND usage.occurred_on BETWEEN previous_first_day AND previous_last_day),
     'totalTokens',(SELECT coalesce(sum(input_tokens+output_tokens),0) FROM coach_private.analytics_token_usage usage WHERE usage.organization_id=actor.organization_id AND usage.occurred_on BETWEEN previous_first_day AND previous_last_day)
   ),
   'providers',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',provider,'inputTokens',input_total,'outputTokens',output_total,'totalTokens',input_total+output_total) ORDER BY input_total+output_total DESC,provider),'[]'::jsonb)
     FROM (SELECT usage.provider,sum(usage.input_tokens) input_total,sum(usage.output_tokens) output_total FROM coach_private.analytics_token_usage usage
       WHERE usage.organization_id=actor.organization_id AND usage.occurred_on>=first_day GROUP BY usage.provider) ranked)
 );
END $$;
REVOKE ALL ON FUNCTION public.coach_admin_token_usage(integer) FROM PUBLIC,coach_app,coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_admin_token_usage(integer) TO coach_app;
