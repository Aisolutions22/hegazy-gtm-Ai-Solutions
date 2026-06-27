
-- 1. contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage contacts" ON public.contacts
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_active ON public.contacts(id) WHERE archived_at IS NULL;
CREATE TRIGGER contacts_updated BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. company_products junction
CREATE TABLE public.company_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_products TO authenticated;
GRANT ALL ON public.company_products TO service_role;
ALTER TABLE public.company_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage company_products" ON public.company_products
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_company_products_company ON public.company_products(company_id);
CREATE INDEX idx_company_products_product ON public.company_products(product_id);

-- 3. Backfill contacts from companies.contact_person
INSERT INTO public.contacts (company_id, full_name, phone, email, is_primary)
SELECT id, contact_person, phone, email, true
FROM public.companies
WHERE contact_person IS NOT NULL AND btrim(contact_person) <> '';
