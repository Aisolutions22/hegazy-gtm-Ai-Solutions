
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin');
CREATE TYPE public.company_type AS ENUM ('customer', 'target', 'opportunity');
CREATE TYPE public.pipeline_status AS ENUM ('lead', 'contacted', 'qualified', 'negotiation', 'won', 'lost');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'completed');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.activity_action AS ENUM ('created', 'edited', 'archived', 'restored', 'status_changed');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'ar',
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user updates own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "user inserts own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'))
$$;

-- New-user trigger: create profile + assign role (first user = owner, rest = admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN assigned_role := 'owner'; ELSE assigned_role := 'admin'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SECTORS ============
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sectors TO authenticated;
GRANT ALL ON public.sectors TO service_role;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage sectors" ON public.sectors FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER sectors_updated BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.company_type NOT NULL DEFAULT 'target',
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  website TEXT,
  linkedin TEXT,
  location TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  logo_url TEXT,
  status TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage companies" ON public.companies FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX companies_type_idx ON public.companies(type) WHERE archived_at IS NULL;
CREATE INDEX companies_sector_idx ON public.companies(sector_id);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  default_margin NUMERIC(6,2) DEFAULT 0,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage products" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OPPORTUNITIES ============
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT,
  expected_tons NUMERIC(12,2) DEFAULT 0,
  expected_revenue NUMERIC(14,2) DEFAULT 0,
  expected_profit NUMERIC(14,2) DEFAULT 0,
  blockers TEXT,
  next_action TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline DATE,
  pipeline_status public.pipeline_status NOT NULL DEFAULT 'lead',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage opportunities" ON public.opportunities FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER opportunities_updated BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX opp_status_idx ON public.opportunities(pipeline_status) WHERE archived_at IS NULL;
CREATE INDEX opp_company_idx ON public.opportunities(company_id);

-- ============ SALES RECORDS ============
CREATE TABLE public.sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  period_month DATE NOT NULL,
  tons NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  margin NUMERIC(8,4) GENERATED ALWAYS AS (CASE WHEN revenue > 0 THEN (profit / revenue) * 100 ELSE 0 END) STORED,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sales_records TO authenticated;
GRANT ALL ON public.sales_records TO service_role;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage sales" ON public.sales_records FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER sales_updated BEFORE UPDATE ON public.sales_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX sales_period_idx ON public.sales_records(period_month);
CREATE INDEX sales_company_idx ON public.sales_records(company_id);

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'todo',
  deadline DATE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage tasks" ON public.tasks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX tasks_status_idx ON public.tasks(status) WHERE archived_at IS NULL;
CREATE INDEX tasks_deadline_idx ON public.tasks(deadline) WHERE archived_at IS NULL;

-- ============ TASK COMMENTS ============
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read task comments" ON public.task_comments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert task comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "user delete own comment" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ ACTIVITY LOG ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action public.activity_action NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read activity" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert activity" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX activity_created_idx ON public.activity_logs(created_at DESC);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ APP SETTINGS ============
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  logo_url TEXT,
  default_locale TEXT NOT NULL DEFAULT 'ar',
  default_theme TEXT NOT NULL DEFAULT 'light',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read settings" ON public.app_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "owner write settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============ WON OPPORTUNITY TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_opportunity_won()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pipeline_status = 'won' AND (OLD.pipeline_status IS DISTINCT FROM 'won') THEN
    UPDATE public.companies SET type = 'customer' WHERE id = NEW.company_id AND type <> 'customer';
    INSERT INTO public.sales_records (company_id, product_id, opportunity_id, period_month, tons, revenue, profit, created_by)
    VALUES (NEW.company_id, NEW.product_id, NEW.id, date_trunc('month', now())::date, COALESCE(NEW.expected_tons,0), COALESCE(NEW.expected_revenue,0), COALESCE(NEW.expected_profit,0), NEW.owner_id);
    INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, meta)
    VALUES (NEW.owner_id, 'opportunity', NEW.id, 'status_changed', jsonb_build_object('from', OLD.pipeline_status, 'to', 'won'));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER opportunity_won_trigger
AFTER UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.handle_opportunity_won();

-- ============ SEED DATA ============
INSERT INTO public.sectors (name_en, name_ar) VALUES
  ('Construction', 'الإنشاءات'),
  ('Cookware', 'أواني الطهي'),
  ('Industrial', 'الصناعي'),
  ('Packaging', 'التغليف'),
  ('Electrical', 'الكهرباء'),
  ('Other', 'أخرى');

INSERT INTO public.products (name_en, name_ar, description, default_margin) VALUES
  ('Aluminum Coils', 'لفائف الألومنيوم', 'High-quality aluminum coils', 12),
  ('Aluminum Circles', 'دوائر الألومنيوم', 'Aluminum circles for cookware', 15),
  ('Aluminum Sheets', 'ألواح الألومنيوم', 'Flat aluminum sheets', 10),
  ('Deoxidizer', 'مزيل الأكسدة', 'Aluminum deoxidizer for steel industry', 20);
