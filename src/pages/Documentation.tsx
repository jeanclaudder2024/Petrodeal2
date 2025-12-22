import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Code, 
  Ship, 
  Anchor, 
  Factory, 
  Users, 
  CreditCard, 
  Shield, 
  Zap, 
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '@/components/landing/LandingNavbar';
import Footer from '@/components/Footer';

const Documentation = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of PetroDealHub and how to navigate the platform.',
      articles: [
        { title: 'Account Registration', description: 'How to create and verify your account' },
        { title: 'Dashboard Overview', description: 'Understanding your main dashboard' },
        { title: 'Navigation Guide', description: 'Finding your way around the platform' },
        { title: 'Profile Setup', description: 'Complete your profile and preferences' },
      ]
    },
    {
      title: 'Vessel Tracking',
      icon: Ship,
      description: 'Track vessels in real-time and access detailed vessel information.',
      articles: [
        { title: 'Real-time Tracking', description: 'Monitor vessel positions globally' },
        { title: 'Vessel Search', description: 'Find vessels by name, IMO, or MMSI' },
        { title: 'Voyage History', description: 'View historical voyage data' },
        { title: 'Vessel Specifications', description: 'Access detailed vessel information' },
      ]
    },
    {
      title: 'Ports & Terminals',
      icon: Anchor,
      description: 'Access comprehensive port information and terminal data.',
      articles: [
        { title: 'Port Directory', description: 'Browse our global port database' },
        { title: 'Terminal Information', description: 'Access terminal specifications' },
        { title: 'Port Status', description: 'Check port operational status' },
        { title: 'Berthing Information', description: 'View berthing availability' },
      ]
    },
    {
      title: 'Refineries',
      icon: Factory,
      description: 'Explore refinery data, capacities, and operational information.',
      articles: [
        { title: 'Refinery Database', description: 'Access global refinery information' },
        { title: 'Capacity Data', description: 'View refinery processing capacities' },
        { title: 'Production Types', description: 'Understand refinery outputs' },
        { title: 'Operator Details', description: 'Find refinery operators' },
      ]
    },
    {
      title: 'Broker Services',
      icon: Users,
      description: 'Learn about our broker program and trading services.',
      articles: [
        { title: 'Becoming a Broker', description: 'Join our broker network' },
        { title: 'Creating Deals', description: 'How to create and manage deals' },
        { title: 'Document Templates', description: 'Access trading documents' },
        { title: 'Commission Structure', description: 'Understanding broker commissions' },
      ]
    },
    {
      title: 'Subscriptions & Billing',
      icon: CreditCard,
      description: 'Manage your subscription, billing, and payment options.',
      articles: [
        { title: 'Plan Comparison', description: 'Compare subscription tiers' },
        { title: 'Billing Management', description: 'Manage your payment methods' },
        { title: 'Invoice History', description: 'Access your invoices' },
        { title: 'Upgrade/Downgrade', description: 'Change your subscription' },
      ]
    },
    {
      title: 'API Documentation',
      icon: Code,
      description: 'Technical documentation for API integration.',
      articles: [
        { title: 'API Overview', description: 'Introduction to our REST API' },
        { title: 'Authentication', description: 'API key management' },
        { title: 'Endpoints', description: 'Available API endpoints' },
        { title: 'Rate Limits', description: 'Understanding API rate limits' },
      ]
    },
    {
      title: 'Security & Privacy',
      icon: Shield,
      description: 'Learn about our security measures and privacy policies.',
      articles: [
        { title: 'Data Security', description: 'How we protect your data' },
        { title: 'Privacy Policy', description: 'Our privacy commitments' },
        { title: 'Two-Factor Auth', description: 'Enable 2FA for your account' },
        { title: 'Compliance', description: 'Industry compliance standards' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive guides and documentation for PetroDealHub platform
          </p>
        </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/tutorials')}>
          <Zap className="h-5 w-5" />
          <span>Video Tutorials</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/api-integration')}>
          <Code className="h-5 w-5" />
          <span>API Reference</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/support')}>
          <FileText className="h-5 w-5" />
          <span>FAQs</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/subscription')}>
          <CreditCard className="h-5 w-5" />
          <span>Pricing</span>
        </Button>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card key={section.title} className="trading-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                {section.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.articles.map((article, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-sm">{article.title}</div>
                      <div className="text-xs text-muted-foreground">{article.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="trading-card mt-12">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => navigate('/support')}>
              Contact Support
            </Button>
            <Button variant="outline" onClick={() => navigate('/new-ticket')}>
              Create Support Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Documentation;
