import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Clock } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
const Policies = () => {
  const effectiveDate = "July 19, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
       <LandingNavbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Please read these Terms carefully before using PetroDealHub
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Effective Date: {effectiveDate}</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="trading-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Welcome to PetroDealHub</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to PetroDealHub, the premier platform for petroleum trade support, insight, and professional
                enablement. These Terms of Service (“Terms”) govern your use of our platform and services. By
                accessing or using any part of the platform, you agree to be bound by these Terms.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                PetroDealHub is a registered trademark operated under a United States-based company. The platform is
                developed to provide high-level tools, trade documentation, and access modules that help users present
                themselves as active participants, dealers, or brokers in the global oil trade sector.
              </p>
            </CardContent>
          </Card>

          {/* 1. Platform Purpose */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">1. Platform Purpose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                PetroDealHub offers services tailored to professionals operating in or exploring the petroleum trade
                market. These include:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Access to data related to refineries, tankers, shipments, and documentation.</li>
                <li>Smart formatting of business documents (e.g., LOI, B/L, SPA).</li>
                <li>Subscription features including custom deal flows, shipment trackers, and structured simulations.</li>
                <li>An integrated space for refining commercial presentation and positioning.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                While PetroDealHub is designed for deal facilitation and business readiness, we do not act as a party to
                any actual transaction.
              </p>
            </CardContent>
          </Card>

          {/* 2. User Eligibility */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">2. User Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To use PetroDealHub, you must be at least 18 years old and legally authorized to enter into business
                contracts.
              </p>
            </CardContent>
          </Card>

          {/* 3. Use of Services */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">3. Use of Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                You agree to use the platform in good faith and in compliance with applicable laws. You shall not:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Misrepresent your identity or business purpose.</li>
                <li>Violate the integrity of the platform or exploit it to harm others.</li>
                <li>Use any portion of the content to mislead third parties.</li>
                <li>Engage in illegal, misleading, or unethical practices.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Subscriptions and Dealer Access */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">4. Subscriptions and Dealer Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Access to advanced tools and structured features is subject to subscription. These include but are not
                limited to:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Dealer-style profile creation and access</li>
                <li>Professionally formatted trade documents and reports</li>
                <li>Insight-based tanker/refinery dashboards</li>
                <li>Simulated and scenario-based deal modules</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Subscriptions are offered as professional enablement tools and do not constitute endorsement, guarantee,
                or confirmation of real-world deals. PetroDealHub reserves the right to add, modify, or discontinue any
                subscription feature at any time.
              </p>
            </CardContent>
          </Card>

          {/* 5. No Guarantees or Endorsements */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">5. No Guarantees or Endorsements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                All content is provided with the intent to support decision-making, but we do not guarantee the
                truthfulness, legality, or validity of any scenario, listing, or data point. Users are solely
                responsible for verifying information before using it in real-world engagements.
              </p>
            </CardContent>
          </Card>

          {/* 6. Intellectual Property */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">6. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                All platform elements are protected by copyright, trademark, and international IP laws. You may not
                reuse, clone, or rebrand any part of the system.
              </p>
            </CardContent>
          </Card>

          {/* 7. Privacy and Data */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">7. Privacy and Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Your data is collected and processed in line with our Privacy Policy. Continued use of the platform
                implies agreement with that policy.
              </p>
            </CardContent>
          </Card>

          {/* 8. Modifications */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">8. Modifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms at our discretion. All changes will take effect once published.
              </p>
            </CardContent>
          </Card>

          {/* 9. Termination */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">9. Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate any account if it violates our Terms or disrupts the platform’s operations.
              </p>
            </CardContent>
          </Card>

          {/* 10. Governing Law */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">10. Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and interpreted in accordance with the laws of the State of Delaware,
                United States.
              </p>
            </CardContent>
          </Card>

          {/* 11. Limitation of Liability */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-2xl">11. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Under no circumstance shall PetroDealHub be held liable for indirect, consequential, or incidental
                damages arising from your use of the platform or its services.
              </p>
            </CardContent>
          </Card>

          {/* 12. Contact */}
          <Card className="trading-card bg-muted/50">
            <CardHeader>
              <CardTitle className="text-2xl">12. Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground leading-relaxed">
                Legal inquiries should be directed to:
              </p>
              <div className="space-y-1">
                <p className="text-foreground font-medium">PetroDealHub Legal Department</p>
                <p className="text-foreground">
                  Email: <a href="mailto:legal@petrodealhub.com" className="underline">legal@petrodealhub.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Policies;
