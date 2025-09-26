import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Video,
  FileText,
  Headphones,
  Plus,
  Ticket,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const Support = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I start trading oil on PetroDeallHub?',
      answer: 'To start trading oil on our platform, you need to: 1) Create an account and complete verification, 2) Subscribe to a suitable plan, 3) Access the Trading Deals section, 4) Create your first deal by specifying oil type, quantity, and terms.',
      category: 'Getting Started'
    },
    {
      id: '2',
      question: 'What types of oil can I trade on the platform?',
      answer: 'Our platform supports trading of various oil types including Brent Crude, WTI (West Texas Intermediate), Dubai Crude, Heavy Crude, Light Crude, and other regional oil varieties. Each oil type has real-time pricing and market data available.',
      category: 'Trading'
    },
    {
      id: '3',
      question: 'How accurate are the real-time oil prices?',
      answer: 'Our oil prices are sourced from major exchanges including ICE, NYMEX, and DME. Prices are updated in real-time and include 24-hour changes and percentage variations to ensure you have the most current market information.',
      category: 'Pricing'
    },
    {
      id: '4',
      question: 'What subscription plans are available?',
      answer: 'We offer multiple subscription tiers: Basic (essential features), Premium (advanced analytics and higher limits), and Enterprise (full access with custom integrations). Each plan includes different vessel limits, port access, and support levels.',
      category: 'Subscription'
    },
    {
      id: '5',
      question: 'How do I verify my company on the platform?',
      answer: 'Company verification involves: 1) Submitting official business documents, 2) Providing proof of oil trading activities, 3) Identity verification of key personnel, 4) Our team reviews within 2-3 business days and contacts you with the results.',
      category: 'Verification'
    },
    {
      id: '6',
      question: 'Is my data secure on PetroDeallHub?',
      answer: 'Yes, we implement bank-level security including SSL encryption, two-factor authentication, regular security audits, and compliance with international data protection regulations. Your trading data and personal information are fully protected.',
      category: 'Security'
    },
    {
      id: '7',
      question: 'How do I access vessel tracking information?',
      answer: 'Vessel tracking is available in the Vessels section of your dashboard. You can search by vessel name, IMO number, or filter by cargo type. Premium subscribers get real-time GPS tracking and estimated arrival times.',
      category: 'Vessels'
    },
    {
      id: '8',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards (Visa, MasterCard, American Express), bank transfers, and corporate invoicing for Enterprise clients. All payments are processed securely through Stripe with industry-standard encryption.',
      category: 'Payment'
    }
  ];

  const categories = ['All', 'Getting Started', 'Trading', 'Pricing', 'Subscription', 'Verification', 'Security', 'Vessels', 'Payment'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll get back to you within 24 hours.",
    });
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general'
    });
  };

  return (
    <div className="bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Support Center
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get help with PetroDeallHub. Find answers to common questions or contact our support team.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="trading-card text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground">Comprehensive guides and API docs</p>
            </CardContent>
          </Card>
          <Card className="trading-card text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Video className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
            </CardContent>
          </Card>
          <Card className="trading-card text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with our support team</p>
            </CardContent>
          </Card>
          <Card className="trading-card text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Headphones className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-muted-foreground">Talk to an expert directly</p>
            </CardContent>
          </Card>
        </div>

        {/* Support Tickets Section */}
        <div className="mb-12">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Ticket className="h-6 w-6 text-primary" />
                Support Tickets
              </CardTitle>
              <p className="text-muted-foreground">
                Create and manage your support tickets for personalized assistance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Plus className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Create New Ticket</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Submit a detailed support request for technical issues, account problems, or general inquiries
                    </p>
                    <Button 
                      onClick={() => navigate('/new-ticket')}
                      className="w-full"
                    >
                      Create Ticket
                    </Button>
                  </CardContent>
                </Card>
                
                {user && (
                  <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Eye className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">My Tickets</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        View and track the status of your existing support tickets
                      </p>
                      <Button 
                        onClick={() => navigate('/my-tickets')}
                        variant="outline"
                        className="w-full"
                      >
                        View My Tickets
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {!user && (
                  <Card className="border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <MessageCircle className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Sign In for Tickets</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sign in to your account to view and manage your support tickets
                      </p>
                      <Button 
                        onClick={() => navigate('/auth')}
                        variant="outline"
                        className="w-full"
                      >
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="border border-border rounded-lg">
                    <button
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                        <span className="font-medium">{faq.question}</span>
                      </div>
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="p-4 pt-0 text-muted-foreground">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
                {filteredFAQs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No FAQs found matching your search criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-muted-foreground">support@petrodealllhub.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Phone Support</div>
                    <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Business Hours</div>
                    <div className="text-sm text-muted-foreground">Mon-Fri: 9AM-6PM EST</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Describe your question or issue..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="trading-card bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">All Systems Operational</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Platform is running smoothly
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;