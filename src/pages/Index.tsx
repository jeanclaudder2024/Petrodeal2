import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/contexts/AccessContext";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/Hero";
import IndustrialWhySection from "@/components/landing/IndustrialWhySection";
import HowItWorks from "@/components/landing/HowItWorks";
import IndustrialImageGallery from "@/components/landing/IndustrialImageGallery";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import RealResults from "@/components/landing/RealResults";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accessType, hasAccess } = useAccess();

  useEffect(() => {
    // If user is authenticated and has access (trial or subscription), redirect to dashboard
    if (user && hasAccess && (accessType === 'trial' || accessType === 'subscription')) {
      navigate("/dashboard");
    }
  }, [user, hasAccess, accessType, navigate]);

  // Show industrial landing page for non-authenticated users or users without access
  return (
    <div className="min-h-screen landing-page-container dark">
      <LandingNavbar />
      <div id="home">
        <Hero />
      </div>
      <div id="about">
        <IndustrialWhySection />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="gallery">
        <IndustrialImageGallery />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="testimonials">
        <TestimonialsSection />
      </div>
      <div id="services">
        <RealResults />
      </div>
      <div id="contact">
        <FinalCTA />
      </div>
      <Footer />
    </div>
  );
};

export default Index;