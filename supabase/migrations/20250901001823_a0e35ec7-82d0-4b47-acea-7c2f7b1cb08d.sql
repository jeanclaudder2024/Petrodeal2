-- Insert default content for all landing page sections
INSERT INTO public.landing_page_content (section_name, title, subtitle, description, content, is_active) VALUES
('hero', 'The Future of Oil Trading is Here', 'Revolutionary Platform for Maritime Energy Trading', 'Connect. Trade. Prosper. Join the global network of oil traders, brokers, and maritime professionals transforming the energy sector with AI-powered insights and real-time market intelligence.', '{"cta_primary": "Start Free Trial", "cta_secondary": "Watch Demo", "location": "Houston, USA"}', true),

('features', 'Advanced Maritime Trading Technology', null, 'Harness the power of AI and real-time data to dominate the oil trading markets with our comprehensive maritime intelligence platform.', '{"features_count": 9, "professionals_count": "500+"}', true),

('why_section', 'Traditional oil trading is broken. We fixed it.', 'Why Choose Us', 'Transform your petroleum trading operations with cutting-edge technology that delivers measurable results from day one.', '{"main_pillars": 4, "benefits": 4}', true),

('how_it_works', 'From Discovery to Deal Completion', 'How It Works', 'Our streamlined process transforms complex oil trading into a seamless, efficient experience that saves time and maximizes profits.', '{"steps": 4, "process_type": "streamlined"}', true),

('real_results', 'Real Impact, Real Results', 'Proven Results', 'Join thousands of professionals who have transformed their trading operations and achieved unprecedented success with PetroDealHub.', '{"trading_volume": "$2.4B", "active_traders": "15,000+", "success_rate": "99.9%", "speed_improvement": "87%"}', true),

('final_cta', 'Transform Your Global Petroleum Trading', 'Get Started Today', 'Join hundreds of traders and brokers who are already revolutionizing their operations with PetroDealHub.', '{"contact_form": true, "demo_available": true, "trial_available": true}', true),

('testimonials', 'What Industry Leaders Say', 'Client Testimonials', 'Hear from the professionals who are already transforming their trading operations with our platform.', '{"testimonials_count": 3, "average_rating": 5}', true),

('pricing', 'Choose Your Trading Plan', 'Flexible Pricing', 'Start your transformation with our comprehensive trading platform. Choose the plan that fits your business needs.', '{"plans_available": 3, "trial_days": 5, "money_back_guarantee": true}', true)

ON CONFLICT (section_name) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  updated_at = now();