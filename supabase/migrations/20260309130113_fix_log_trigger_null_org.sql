
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_org_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        current_org_id := OLD.organization_id;
    ELSE
        current_org_id := NEW.organization_id;
    END IF;

    -- Skip logging if no org_id (avoids NOT NULL violation)
    IF current_org_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    INSERT INTO public.audit_logs (
        table_name, record_id, action, old_data, new_data, changed_by, organization_id
    ) VALUES (
        TG_TABLE_NAME,
        CASE WHEN (TG_OP = 'DELETE') THEN OLD.id ELSE NEW.id END,
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW),
        auth.uid(),
        current_org_id
    );

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;
;
