
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_non_conformities_updated_at() SET search_path = public;
ALTER FUNCTION public.update_corrective_actions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_corrective_actions_closed_at() SET search_path = public;
ALTER FUNCTION public.sync_user_metadata_to_jwt() SET search_path = public;
ALTER FUNCTION public.log_table_change() SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.get_user_organization_id() SET search_path = public;
ALTER FUNCTION public.update_version_and_timestamp() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
;
