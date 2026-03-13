ALTER TABLE public.client_tasks
  ADD COLUMN IF NOT EXISTS service_line_id uuid REFERENCES public.client_service_lines(id) ON DELETE SET NULL;

ALTER TABLE public.client_deadlines
  ADD COLUMN IF NOT EXISTS service_line_id uuid REFERENCES public.client_service_lines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_tasks_service_line_id
  ON public.client_tasks(service_line_id);

CREATE INDEX IF NOT EXISTS idx_client_deadlines_service_line_id
  ON public.client_deadlines(service_line_id);

COMMENT ON COLUMN public.client_tasks.service_line_id IS
  'Optional explicit link to the client service line this task is covering.';

COMMENT ON COLUMN public.client_deadlines.service_line_id IS
  'Optional explicit link to the client service line this deadline is tracking.';
