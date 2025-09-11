-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies table
CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete companies" ON public.companies FOR DELETE USING (true);