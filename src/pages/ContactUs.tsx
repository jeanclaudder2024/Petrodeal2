import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail,
  MapPin,
  Clock,
  Scale,
  Handshake,
  HeadphonesIcon,
  MessageSquare,
  Globe
} from "lucide-react";

const ContactUs = () => {
  const contactSections = [
    {
      icon: Mail,
      title: "General Inquiries",
      description: "For questions, support, or exploring our services",
      details: [
        { icon: Mail, label: "Email", value: "support@petrodealhub.com", href: "mailto:support@petrodealhub.com" },
        { icon: MapPin, label: "Head Office", value: "PetroDealHub, United States (Delaware-based operation)", href: null },
        { icon: Clock, label: "Business Hours", value: "Monday to Friday, 9:00 AM – 5:00 PM (Eastern Time)", href: null }
      ]
    },
    {
      icon: Scale,
      title: "Legal or Compliance",
      description: "For legal correspondence, Terms, Policies, or Subscription Services",
      details: [
        { icon: Mail, label: "Legal Department", value: "legal@petrodealhub.com", href: "mailto:legal@petrodealhub.com" }
      ]
    },
    {
      icon: Handshake,
      title: "Partner With Us",
      description: "For refineries, brokers, or shipping firms interested in collaboration",
      details: [
        { icon: Mail, label: "Partnerships", value: "partners@petrodealhub.com", href: "mailto:partners@petrodealhub.com" }
      ]
    },
    {
      icon: HeadphonesIcon,
      title: "Need Help?",
      description: "For technical issues, account assistance, or subscription questions",
      details: [
        { icon: Mail, label: "Support Team", value: "support@petrodealhub.com", href: "mailto:support@petrodealhub.com" },
        { icon: Clock, label: "Response Time", value: "We aim to respond within 1–2 business days", href: null }
      ]
    },
    {
      icon: MessageSquare,
      title: "Feedback",
      description: "We welcome suggestions and ideas for improving PetroDealHub",
      details: [
        { icon: Mail, label: "Share Ideas", value: "support@petrodealhub.com", href: "mailto:support@petrodealhub.com" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white">
              📞 Get In Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Contact Us
            </h1>
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-lg">
              <p className="text-lg text-gray-300 leading-relaxed mb-4">
                Thank you for your interest in PetroDealHub — the trusted platform for petroleum trading professionals.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mb-4">
                We value every inquiry, whether you're a broker, refinery representative, shipping operator, or simply 
                exploring how our tools and services can support your goals in the oil trade sector.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                If you have questions, need support, or wish to partner with us, please don't hesitate to reach out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Sections */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            {contactSections.map((section, index) => (
              <Card 
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gray-800/80 backdrop-blur-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Section Header */}
                  <div className="lg:w-1/3">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
                        <section.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      {section.description}
                    </p>
                  </div>

                  {/* Contact Details */}
                  <div className="lg:w-2/3">
                    <div className="space-y-4">
                      {section.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start gap-3 p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-colors">
                          <detail.icon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white mb-1">
                              {detail.label}
                            </p>
                            {detail.href ? (
                              <a 
                                href={detail.href}
                                className="text-gray-300 hover:text-white transition-colors"
                              >
                                {detail.value}
                              </a>
                            ) : (
                              <p className="text-gray-300">
                                {detail.value}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Contact CTA */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Join thousands of petroleum professionals who trust PetroDealHub for their trading operations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:shadow-lg px-8 py-4 text-white"
              >
                <Mail className="w-5 h-5 mr-2" />
                General Support
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-4 border border-blue-500/30 text-white hover:bg-blue-500/10"
              >
                <Handshake className="w-5 h-5 mr-2" />
                Partnership Inquiries
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-4 border border-green-500/30 text-white hover:bg-green-500/10"
              >
                <Scale className="w-5 h-5 mr-2" />
                Legal & Compliance
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <Globe className="w-16 h-16 mx-auto mb-6 text-blue-500" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Global Platform, Local Support
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                While our headquarters are in Delaware, United States, PetroDealHub serves petroleum 
                professionals worldwide. Our platform operates 24/7 to support global trading operations 
                across all time zones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Send Us a Message
              </h2>
              <p className="text-lg text-gray-300">
                Have a question, feedback, or proposal? Use the form below to contact our team directly.
              </p>
            </div>

            <Card className="p-8 bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg">
              <form className="space-y-6">
                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Subject
                  </label>
                  <input 
                    type="text" 
                    placeholder="Subject of your message"
                    className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Message
                  </label>
                  <textarea 
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="text-center">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:shadow-lg px-8 py-4 text-white"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
