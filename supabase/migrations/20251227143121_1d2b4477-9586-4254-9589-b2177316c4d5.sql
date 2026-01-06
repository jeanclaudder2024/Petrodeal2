-- Seed default blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Oil Trading', 'oil-trading', 'Insights and analysis on global oil trading strategies, market dynamics, and deal structures'),
  ('Market Analysis', 'market-analysis', 'In-depth analysis of oil prices, market trends, and economic factors affecting the petroleum industry'),
  ('Platform Updates', 'platform-updates', 'Latest features, improvements, and announcements from PetroDealHub'),
  ('Industry Insights', 'industry-insights', 'Expert perspectives on the oil and gas industry, including regulatory updates and technological advancements'),
  ('Deal Strategies', 'deal-strategies', 'Best practices for structuring, negotiating, and closing oil trading deals')
ON CONFLICT (slug) DO NOTHING;