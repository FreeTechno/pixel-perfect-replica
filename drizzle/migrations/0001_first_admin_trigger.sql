DROP TRIGGER IF EXISTS on_auth_user_created_first_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_first_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitions, public.teams, public.matches, public.team_match_stats, public.historical_results, public.analyses, public.pdf_reports, public.sync_logs TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;