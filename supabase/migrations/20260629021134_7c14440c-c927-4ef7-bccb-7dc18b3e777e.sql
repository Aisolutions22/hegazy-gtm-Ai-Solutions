
-- 1) display_number on companies, contacts, products, sectors
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['companies','contacts','products','sectors'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN display_number BIGINT', t);
    EXECUTE format('WITH numbered AS (SELECT id, row_number() OVER (ORDER BY created_at ASC) AS rn FROM public.%I) UPDATE public.%I c SET display_number = n.rn FROM numbered n WHERE c.id = n.id', t, t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN display_number SET NOT NULL', t);
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I_display_number_seq', t);
    EXECUTE format('SELECT setval(%L, (SELECT COALESCE(MAX(display_number),0) FROM public.%I))', t || '_display_number_seq', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN display_number SET DEFAULT nextval(%L)', t, t || '_display_number_seq');
    EXECUTE format('ALTER SEQUENCE %I_display_number_seq OWNED BY public.%I.display_number', t, t);
    EXECUTE format('CREATE UNIQUE INDEX %I_display_number_idx ON public.%I(display_number)', t, t);
  END LOOP;
END $$;

-- 2) company_documents table (Drive links)
CREATE TABLE public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_documents TO authenticated;
GRANT ALL ON public.company_documents TO service_role;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage company_documents" ON public.company_documents FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX company_documents_company_id_idx ON public.company_documents(company_id);
CREATE TRIGGER set_company_documents_updated_at BEFORE UPDATE ON public.company_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
