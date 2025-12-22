-- Seed content_sections for major pages with their actual content
UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "The AI-Powered Platform for Global Oil Trading", "subtitle": "Track vessels, connect with refineries, and close deals faster with real-time intelligence"},
  {"type": "features", "title": "Why PetroDealHub?", "items": ["Real-time vessel tracking", "Global refinery database", "Broker network", "AI-powered insights"]},
  {"type": "cta", "title": "Transform Your Global Petroleum Trading", "button_text": "Start Free Trial"}
]'::jsonb WHERE page_slug = 'home' OR page_slug = '/';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "About PetroDealHub", "subtitle": "The trusted platform for petroleum trading professionals"},
  {"type": "mission", "title": "Our Mission", "content": "To revolutionize global oil trading by connecting industry professionals with real-time intelligence and verified data"},
  {"type": "values", "title": "Our Values", "items": ["Transparency", "Innovation", "Security", "Excellence"]}
]'::jsonb WHERE page_slug = 'about';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Contact Us", "subtitle": "Get in touch with our team"},
  {"type": "contact_info", "email": "support@petrodealhub.com", "location": "Delaware, United States"},
  {"type": "form", "title": "Send Us a Message", "fields": ["name", "email", "subject", "message"]}
]'::jsonb WHERE page_slug = 'contact';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Careers at PetroDealHub", "subtitle": "Join our team and shape the future of oil trading"},
  {"type": "benefits", "title": "Why Work With Us", "items": ["Competitive salary", "Remote-first culture", "Growth opportunities", "Cutting-edge technology"]}
]'::jsonb WHERE page_slug = 'careers';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Vessel Tracking", "subtitle": "Real-time tracking for global oil tankers"},
  {"type": "features", "title": "Key Features", "items": ["Live AIS data", "Historical voyage data", "Port call predictions", "Cargo tracking"]}
]'::jsonb WHERE page_slug = 'vessel-news';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Port Intelligence", "subtitle": "Comprehensive data on global petroleum ports"},
  {"type": "features", "title": "Port Data", "items": ["Terminal information", "Capacity details", "Operational status", "Berthing availability"]}
]'::jsonb WHERE page_slug = 'port-news';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Refinery Analytics", "subtitle": "Global refinery database and production insights"},
  {"type": "features", "title": "Refinery Data", "items": ["Processing capacity", "Product outputs", "Operator details", "Maintenance schedules"]}
]'::jsonb WHERE page_slug = 'refinery-news';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Platform Features", "subtitle": "Discover everything PetroDealHub has to offer"},
  {"type": "features", "title": "Core Features", "items": ["Vessel tracking", "Port intelligence", "Refinery analytics", "Broker network", "Document generation", "API access"]}
]'::jsonb WHERE page_slug = 'future-trading';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Support Center", "subtitle": "Get help with PetroDealHub"},
  {"type": "resources", "title": "Support Resources", "items": ["FAQs", "Documentation", "Contact support", "Submit ticket"]}
]'::jsonb WHERE page_slug = 'support-news';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "API Integration", "subtitle": "Connect your systems with PetroDealHub API"},
  {"type": "features", "title": "API Features", "items": ["RESTful endpoints", "Real-time data", "Webhook support", "Rate limiting"]}
]'::jsonb WHERE page_slug = 'api-integration';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Blog & Market Reports", "subtitle": "Industry insights and market analysis"},
  {"type": "categories", "title": "Topics", "items": ["Market analysis", "Industry news", "Trading insights", "Regulatory updates"]}
]'::jsonb WHERE page_slug = 'blog';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Documentation", "subtitle": "Comprehensive guides for PetroDealHub platform"},
  {"type": "sections", "items": ["Getting Started", "Vessel Tracking", "Ports & Terminals", "Refineries", "Broker Services", "API Documentation"]}
]'::jsonb WHERE page_slug = 'documentation';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Privacy Policy", "subtitle": "How we protect your data"},
  {"type": "content", "sections": ["Data Collection", "Data Usage", "Data Protection", "Your Rights"]}
]'::jsonb WHERE page_slug = 'privacy-policy';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Terms of Service", "subtitle": "Terms and conditions for using PetroDealHub"},
  {"type": "content", "sections": ["Acceptance of Terms", "User Responsibilities", "Service Description", "Limitations"]}
]'::jsonb WHERE page_slug = 'policies';

UPDATE cms_page_content SET content_sections = '[
  {"type": "hero", "title": "Cookie Policy", "subtitle": "How we use cookies on our platform"},
  {"type": "content", "sections": ["What are cookies", "Types of cookies", "Cookie management", "Third-party cookies"]}
]'::jsonb WHERE page_slug = 'cookies';