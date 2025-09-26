import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Mail, Globe, Users, AlertTriangle } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-800 via-gray-900 to-black py-16 lg:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
              Legal Documentation
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Effective Date: July 19, 2025
            </p>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Welcome to PetroDealHub. This Privacy Policy explains how we collect, use, and protect your personal information when you access or use our platform. By continuing to use our services, you agree to this policy in full.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Disclaimer Section */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-red-500">
                <AlertTriangle className="h-6 w-6" />
                1. Disclaimer of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                PetroDealHub is a technology platform designed to assist professionals in the petroleum trade. While it offers access to information, tools, and digital services (including subscription-based content), we do not guarantee the accuracy, availability, legality, or reliability of any refinery, tanker, trade document, or offer displayed or shared via the platform.
              </p>
              <p>
                All subscriptions and services are provided "AS IS" and "AS AVAILABLE" with no warranties of any kind. PetroDealHub does not accept liability for any losses, damages, or misunderstandings arising from the use of the platform, paid or unpaid features, or any decisions users make based on platform content.
              </p>
              <p>
                The platform may display real, semi-real, or AI-generated data for educational, analytical, or professional simulation purposes. Users are fully responsible for verifying any information before acting on it.
              </p>
            </CardContent>
          </Card>

          {/* Information Collection */}
          <Card className="bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Users className="h-6 w-6 text-blue-500" />
                2. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>We may collect and process the following types of personal and business-related information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Full name, company name, email address, phone number, country, and user credentials.</li>
                <li><strong>Business Data:</strong> Deal-related information, uploaded documents (e.g., LOI, B/L, SPA), company registration details.</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and access time.</li>
                <li><strong>Usage Data:</strong> Page visits, clicks, session duration, and actions within the platform.</li>
                <li><strong>Location Data (if applicable):</strong> For vessel tracking and refinery identification.</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card className="bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Shield className="h-6 w-6 text-blue-500" />
                3. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Operate and maintain the PetroDealHub platform.</li>
                <li>Facilitate secure oil trade deals between users (brokers, buyers, sellers, refineries).</li>
                <li>Provide real-time tanker tracking and refinery insights.</li>
                <li>Generate and store petroleum trade documentation.</li>
                <li>Communicate with users (e.g., notifications, platform updates).</li>
                <li>Analyze and improve platform performance and user experience.</li>
                <li>Comply with applicable laws and prevent fraudulent activities.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sharing and Disclosure */}
          <Card className="bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Globe className="h-6 w-6 text-blue-500" />
                4. Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>We do not sell or rent your personal data. However, we may share your information in the following cases:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With trusted partners who provide services essential to platform operation.</li>
                <li>When required by law, court order, or governmental request.</li>
                <li>In business transfers, such as a merger or acquisition.</li>
                <li>With your explicit consent, for specific business engagements.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Lock className="h-6 w-6 text-blue-500" />
                5. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                We implement industry-standard security measures (SSL, encryption, secure authentication) to protect your data. However, no system is 100% secure, and users are responsible for keeping their login credentials safe.
              </p>
            </CardContent>
          </Card>

          {/* Rights and Choices */}
          <Card className="bg-gray-800/80">
            <CardHeader>
              <CardTitle className="text-xl text-white">6. Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access, update, or delete your account information.</li>
                <li>Request a copy of your stored data.</li>
                <li>Opt out of marketing communications.</li>
                <li>Object or restrict certain types of processing.</li>
              </ul>
              <p>
                To exercise your rights, contact us at:{" "}
                <a href="mailto:privacy@petrodealhub.com" className="text-blue-500 hover:underline">
                  privacy@petrodealhub.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Additional Sections */}
          {[
            {
              title: "7. Cookies and Tracking Technologies",
              content: "We use cookies and similar technologies to enhance platform performance and understand usage patterns. You can manage cookie preferences through your browser settings."
            },
            {
              title: "8. International Users and Data Transfers",
              content: "PetroDealHub may be accessed globally. By using the platform, you agree to transfer your data to our secure servers, even if located outside your country of residence."
            },
            {
              title: "9. Third-Party Links",
              content: "The platform may contain links to third-party websites or tools (e.g., Google Maps). PetroDealHub is not responsible for their privacy practices. We recommend reading their policies."
            },
            {
              title: "10. Children's Privacy",
              content: "PetroDealHub is not intended for users under the age of 18. We do not knowingly collect personal data from minors."
            },
            {
              title: "11. No Guarantee of Service or Continuity",
              content: "We reserve the right to modify, suspend, limit, or discontinue any feature, service, or subscription at any time without prior notice."
            },
            {
              title: "12. No Intermediary Role or Endorsement",
              content: "PetroDealHub is not a broker, buyer, or seller, and does not guarantee or endorse any transaction, offer, or communication between users. All interactions are at users' own risk."
            },
            {
              title: "13. Refunds and Disputes",
              content: "All subscription fees are non-refundable, unless otherwise agreed in writing. Subscribing does not guarantee access to real deals, valid offers, or verified parties."
            },
            {
              title: "14. Changes to This Policy",
              content: "We may update this policy at any time. Any changes are effective immediately upon posting. Continued use of the platform means acceptance of those changes."
            }
          ].map((section, index) => (
            <Card key={index} className="bg-gray-800/80">
              <CardHeader>
                <CardTitle className="text-xl text-white">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p>{section.content}</p>
              </CardContent>
            </Card>
          ))}

          {/* Contact Section */}
          <Card className="bg-gradient-to-r from-blue-600/10 to-green-600/10 border border-blue-600/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Mail className="h-6 w-6 text-blue-500" />
                15. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                If you have any questions or concerns regarding this Privacy Policy, please contact:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="font-semibold text-white">PetroDealHub Legal</p>
                <p>
                  Email:{" "}
                  <a href="mailto:legal@petrodealhub.com" className="text-blue-500 hover:underline">
                    legal@petrodealhub.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
