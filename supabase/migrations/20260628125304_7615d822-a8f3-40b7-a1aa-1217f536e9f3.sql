ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin TEXT;

CREATE TABLE public.extra_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'contact')),
  entity_id UUID NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extra_fields TO authenticated;
GRANT ALL ON public.extra_fields TO service_role;
ALTER TABLE public.extra_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage extra_fields" ON public.extra_fields
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_extra_fields_entity ON public.extra_fields(entity_type, entity_id);
CREATE TRIGGER extra_fields_updated BEFORE UPDATE ON public.extra_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();