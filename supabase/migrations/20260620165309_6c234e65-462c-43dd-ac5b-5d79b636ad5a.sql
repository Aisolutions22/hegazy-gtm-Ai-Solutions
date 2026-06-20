-- handle_opportunity_won no longer needs SECURITY DEFINER:
-- the trigger only fires on opportunity writes, opportunities are staff-only,
-- and staff already have ALL on companies / sales_records / activity_logs.
ALTER FUNCTION public.handle_opportunity_won() SECURITY INVOKER;