-- A reviewer may attach the approved correction while moving a pending report to its final state.
CREATE OR REPLACE FUNCTION public.coach_feedback_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE actor record;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF (NEW.id,NEW.organization_id,NEW.user_id,NEW.response_id,NEW.created_at) IS DISTINCT FROM
    (OLD.id,OLD.organization_id,OLD.user_id,OLD.response_id,OLD.created_at) THEN RAISE insufficient_privilege; END IF;
 IF NEW.reviewer_id IS NOT NULL THEN
   IF actor.role NOT IN ('reviewer','admin') OR actor.id<>NEW.reviewer_id OR OLD.status<>'pending'
     OR NEW.status NOT IN ('approved','dismissed') THEN RAISE insufficient_privilege; END IF;
   IF (to_jsonb(NEW)-ARRAY['status','reviewer_id','review_note','suggested_answer','updated_at']) IS DISTINCT FROM
      (to_jsonb(OLD)-ARRAY['status','reviewer_id','review_note','suggested_answer','updated_at']) THEN RAISE insufficient_privilege; END IF;
 ELSE
   IF actor.id<>OLD.user_id OR NEW.review_note<>'' OR NEW.status<>(CASE WHEN NEW.rating='helpful' THEN 'recorded' ELSE 'pending' END)
   THEN RAISE insufficient_privilege; END IF;
 END IF;
 RETURN NEW;
END $$;
