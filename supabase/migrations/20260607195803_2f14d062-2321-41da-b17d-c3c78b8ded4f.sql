
-- 1) meetings
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date timestamptz NOT NULL DEFAULT now(),
  attendees text[] NOT NULL DEFAULT '{}',
  notes text,
  decisions text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meetings_company_idx ON public.meetings(company_id) WHERE archived_at IS NULL;
CREATE INDEX meetings_date_idx ON public.meetings(meeting_date DESC) WHERE archived_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage meetings" ON public.meetings
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER meetings_updated BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) company_notes
CREATE TABLE public.company_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_notes_company_idx ON public.company_notes(company_id, created_at DESC) WHERE archived_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_notes TO authenticated;
GRANT ALL ON public.company_notes TO service_role;

ALTER TABLE public.company_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage company_notes" ON public.company_notes
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER company_notes_updated BEFORE UPDATE ON public.company_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) ICP fields on companies
ALTER TABLE public.companies
  ADD COLUMN icp_sector_fit smallint NOT NULL DEFAULT 0 CHECK (icp_sector_fit BETWEEN 0 AND 25),
  ADD COLUMN icp_consumption smallint NOT NULL DEFAULT 0 CHECK (icp_consumption BETWEEN 0 AND 20),
  ADD COLUMN icp_frequency smallint NOT NULL DEFAULT 0 CHECK (icp_frequency BETWEEN 0 AND 15),
  ADD COLUMN icp_profitability smallint NOT NULL DEFAULT 0 CHECK (icp_profitability BETWEEN 0 AND 20),
  ADD COLUMN icp_strategic smallint NOT NULL DEFAULT 0 CHECK (icp_strategic BETWEEN 0 AND 10),
  ADD COLUMN icp_accessibility smallint NOT NULL DEFAULT 0 CHECK (icp_accessibility BETWEEN 0 AND 10),
  ADD COLUMN icp_score smallint GENERATED ALWAYS AS (
    icp_sector_fit + icp_consumption + icp_frequency + icp_profitability + icp_strategic + icp_accessibility
  ) STORED,
  ADD COLUMN icp_tier text GENERATED ALWAYS AS (
    CASE
      WHEN (icp_sector_fit + icp_consumption + icp_frequency + icp_profitability + icp_strategic + icp_accessibility) >= 90 THEN 'A'
      WHEN (icp_sector_fit + icp_consumption + icp_frequency + icp_profitability + icp_strategic + icp_accessibility) >= 75 THEN 'B'
      WHEN (icp_sector_fit + icp_consumption + icp_frequency + icp_profitability + icp_strategic + icp_accessibility) >= 50 THEN 'C'
      ELSE 'low'
    END
  ) STORED;

CREATE INDEX companies_icp_score_idx ON public.companies(icp_score DESC) WHERE archived_at IS NULL;

-- 4) ICP weights config on app_settings (defaults configurable later)
ALTER TABLE public.app_settings
  ADD COLUMN icp_weights jsonb NOT NULL DEFAULT jsonb_build_object(
    'sector_fit', 25,
    'consumption', 20,
    'frequency', 15,
    'profitability', 20,
    'strategic', 10,
    'accessibility', 10
  );
