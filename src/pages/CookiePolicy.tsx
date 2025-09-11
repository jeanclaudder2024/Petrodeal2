import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield,
  Settings,
  BarChart3,
  Users,
  Target,
  Globe,
  Mail,
  CheckCircle,
  AlertCircle,
  Cookie
} from "lucide-react";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      icon: CheckCircle,
      title: "Essential Cookies",
      description: "Required for the basic operation of the platform, such as user login, navigation, and secure access.",
      color: "accent"
    },
    {
      icon: BarChart3,
      title: "Analytics Cookies",
      description: "Used to collect anonymous data about how users interact with the platform. These insights help us improve system performance and user experience.",
      color: "accent-green"
    },
    {
      icon: Settings,
      title: "Preference Cookies",
      description: "Remember your preferences such as language, time zone, or default settings.",
      color: "primary"
    },
    {
      icon: Target,
      title: "Marketing and Retargeting Cookies",
      description: "We may use limited tracking technologies to understand visitor interest. We do not use invasive advertising cookies or sell user data.",
      color: "secondary"
    }
  ];

  const whyWeUseCookies = [
    "Ensure the platform functions properly",
    "Maintain user sessions and log-in states",
    "Analyze traffic and usage patterns to improve performance",
    "Remember user preferences",
    "Deliver relevant content and improve user experience",
    "Secure access to subscription features"
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              🍪 Privacy & Data
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Cookie Policy
            </h1>
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-elegant">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-accent" />
                <p className="text-lg font-medium text-foreground">
                  Effective Date: July 19, 2025
                </p>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                This Cookie Policy explains how PetroDealHub ("we," "our," or "us") uses cookies and similar 
                technologies on our platform. By continuing to use our website, you consent to our use of 
                cookies as described below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              1. What Are Cookies?
            </h2>
            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cookies are small data files stored on your device when you visit a website. They are widely 
                used to make websites function more efficiently and to provide data for performance, analytics, 
                personalization, and security.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why We Use Cookies */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              2. Why We Use Cookies
            </h2>
            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground mb-6">
                We use cookies to:
              </p>
              <div className="space-y-3">
                {whyWeUseCookies.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-3 flex-shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Types of Cookies */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-foreground text-center">
              3. Types of Cookies We Use
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cookieTypes.map((type, index) => (
                <Card 
                  key={index}
                  className="p-8 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${type.color} to-${type.color}/80 flex items-center justify-center flex-shrink-0`}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">
                        {type.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Managing Cookies */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              4. Managing Cookies
            </h2>
            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  You can control or disable cookies through your browser settings. Please note that disabling 
                  essential cookies may limit access to parts of the platform or impact its functionality.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Third-Party Tools */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              5. Third-Party Tools
            </h2>
            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                We may use third-party tools (e.g., traffic analytics, session monitoring) that also rely on cookies. 
                These tools are selected based on their professional standards and privacy commitments. We are not 
                responsible for their policies.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Your Consent */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              6. Your Consent
            </h2>
            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                By using our platform, you agree to the placement of cookies as described. You may withdraw your 
                consent at any time by changing your browser settings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-foreground text-center">
              7. Contact Us
            </h2>
            <Card className="p-8 text-center border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="mb-6">
                <Shield className="w-12 h-12 mx-auto mb-4 text-accent" />
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  If you have questions about our Cookie Policy, please contact:
                </p>
                <p className="text-lg font-medium text-foreground mb-2">
                  PetroDealHub Legal Department
                </p>
              </div>
              
              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                <Mail className="w-5 h-5 mr-2" />
                privacy@petrodealhub.com
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CookiePolicy;