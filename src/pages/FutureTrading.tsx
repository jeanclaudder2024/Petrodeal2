import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Target } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";

const FutureTrading = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[rgb(9,9,11)] text-zinc-100">
       <LandingNavbar />
      {/* Hero */}
      <section className="relative py-28 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-gradient-to-br from-cyan-500/15 to-transparent" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-2xl bg-gradient-to-br from-amber-400/15 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="bg-zinc-800/70 border border-zinc-700/60 text-zinc-200 px-5 py-2 tracking-wider backdrop-blur">
              THE FUTURE OF TRADING
            </Badge>

            <h1 className="font-orbitron text-5xl md:text-7xl font-bold leading-tight text-zinc-50 mb-8">
              The Future of Smart Petroleum Trading Starts Here
            </h1>

            <div className="max-w-4xl mx-auto text-zinc-300 text-lg md:text-xl leading-relaxed space-y-4">
              <p>
                Welcome to PetroDealHub — the world’s pioneering platform dedicated to revolutionizing the petroleum trade.
                We are not just a platform; we are a strategic infrastructure designed to digitally connect every critical
                pillar in the global oil ecosystem: refineries, ports, tankers, cargoes, brokers, and corporates — all in
                one powerful interface.
              </p>
              <p>
                With PetroDealHub, users no longer rely on outdated methods or fractured communication. Our digitally-native
                environment ensures that every shipment, deal, and partner is traceable, structured, and professionally accessible.
              </p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="group px-10 py-6 text-lg font-orbitron font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.5)] hover:shadow-[0_10px_50px_-8px_rgba(34,211,238,0.65)] transition-all duration-300 hover:scale-105 border border-cyan-400/40"
              >
                START YOUR JOURNEY
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                onClick={() => navigate("/contact")}
                size="lg"
                variant="outline"
                className="group px-10 py-6 text-lg font-rajdhani font-semibold border-2 border-zinc-700 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-800/60 backdrop-blur transition-all duration-300 text-zinc-200"
              >
                CONTACT US
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Unique */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="bg-gradient-to-r from-cyan-500 to-amber-400 text-zinc-950 px-6 py-3 mb-6 tracking-wider">
              WHAT MAKES PETRODEALHUB UNIQUE
            </Badge>
            <h2 className="font-orbitron text-4xl md:text-6xl font-bold leading-tight text-zinc-50">
              What Makes PetroDealHub Unique
            </h2>
          </div>

          <Card className="max-w-5xl mx-auto p-8 md:p-10 bg-zinc-900/70 border border-zinc-800 backdrop-blur">
            <ul className="list-disc pl-6 space-y-4 text-zinc-300 leading-relaxed">
              <li>
                <strong className="text-zinc-100">Smart Infrastructure for Oil Trade:</strong> We connect refineries to tankers,
                ports to deals, and brokers to corporations — all on a digitally managed and visually traceable network.
              </li>
              <li>
                <strong className="text-zinc-100">Protection of All Parties:</strong> Whether you are a cargo owner, broker, or refinery,
                you will operate under deal protection logic — with suggested contract templates and data paths to protect your interest
                and commission.
              </li>
              <li>
                <strong className="text-zinc-100">Live Price Updates & Market Awareness:</strong> We provide real-time indicators and
                market shifts, enabling decision-makers to negotiate with clarity and confidence.
              </li>
              <li>
                <strong className="text-zinc-100">Digital Policy First:</strong> PetroDealHub is among the first platforms in petroleum trade
                to adopt a full digital governance strategy — eliminating paper-based inefficiencies and centralizing transactional data.
              </li>
              <li>
                <strong className="text-zinc-100">B2B Subscription Logic:</strong> Only vetted professionals and companies may subscribe,
                enabling a trusted and credible trading environment.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Who Uses */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-zinc-950 px-6 py-3 mb-6 tracking-wider">
              WHO USES PETRODEALHUB
            </Badge>
            <h2 className="font-orbitron text-4xl md:text-6xl font-bold leading-tight text-zinc-50">Who Uses PetroDealHub</h2>
            <p className="text-xl text-zinc-300 mt-6 max-w-3xl mx-auto leading-relaxed">
              Our platform is designed for:
            </p>
          </div>

          <Card className="max-w-5xl mx-auto p-8 md:p-10 bg-zinc-900/70 border border-zinc-800 backdrop-blur">
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 leading-relaxed">
              <li>Oil Brokers & Deal Mediators</li>
              <li>Refinery Sales & Export Officers</li>
              <li>Tanker Owners and Charterers</li>
              <li>Governmental & Private Buyers</li>
              <li>Port Operators and Cargo Officers</li>
              <li>Commodity Trading Firms</li>
              <li>Shipping & Logistic Integrators</li>
            </ul>

            <div className="mt-6 text-zinc-300">
              Whether a solo broker or a global oil major, PetroDealHub scales to your need.
            </div>
          </Card>
        </div>
      </section>

      {/* Future Visions */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="bg-gradient-to-r from-cyan-500 to-emerald-400 text-zinc-950 px-6 py-3 mb-6 tracking-wider">
              FUTURE VISIONS
            </Badge>
            <h2 className="font-orbitron text-4xl md:text-6xl font-bold leading-tight text-zinc-50">
              Future Visions: What We Are Building
            </h2>
          </div>

          <Card className="max-w-5xl mx-auto p-8 md:p-10 bg-zinc-900/70 border border-zinc-800 backdrop-blur">
            <ul className="list-disc pl-6 space-y-3 text-zinc-300 leading-relaxed">
              <li>
                <strong className="text-zinc-100">Blockchain-Secured Contracts:</strong> Smart contract integration for real-time
                execution with payment linkage.
              </li>
              <li>
                <strong className="text-zinc-100">FOB/CIF Smart Deal Mapping:</strong> Ability to dynamically generate shipment terms
                (FOB, CIF, CFR) and associated risk-sharing contracts.
              </li>
              <li>
                <strong className="text-zinc-100">Multi-Gateway Payment Tools:</strong> Enabling B2B payment integrations — bank-to-bank,
                escrow logic, and digital settlement channels.
              </li>
              <li>
                <strong className="text-zinc-100">Mobile App Access:</strong> Real-time deal notifications, port entry alerts, and cargo
                updates — on your phone.
              </li>
              <li>
                <strong className="text-zinc-100">AI-Based Predictive Shipping Flows:</strong> Using AI to predict tanker traffic, pricing
                shifts, and optimal refinery routing.
              </li>
              <li>
                <strong className="text-zinc-100">Regional Expansion Nodes:</strong> Localized support hubs in Houston, Rotterdam, Fujairah,
                and Singapore.
              </li>
              <li>
                <strong className="text-zinc-100">Smart Customs & Compliance Alerts:</strong> Document packs matched to destination country
                requirements and compliance scoring.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Closing */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08),transparent_60%)]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <Card className="max-w-5xl mx-auto p-10 md:p-12 bg-zinc-900/70 border border-emerald-700/30">
            <h3 className="font-orbitron text-3xl md:text-5xl font-bold text-zinc-50 text-center mb-6">
              A New Standard for Global Petroleum Transactions
            </h3>
            <div className="text-lg md:text-xl text-zinc-300 leading-relaxed space-y-4 text-center max-w-3xl mx-auto">
              <p>
                At PetroDealHub, we’re not just enabling deals — we’re defining the new global standard for how petroleum trading operates
                in the digital era.
              </p>
              <p>
                Whether you're a first-time broker or a multinational buyer, our platform gives you visibility, structure, and opportunity
                in one seamless experience.
              </p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="group px-10 py-6 text-lg font-orbitron font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.5)] hover:shadow-[0_10px_50px_-8px_rgba(34,211,238,0.65)] transition-all duration-300 hover:scale-105 border border-cyan-400/40"
              >
                START YOUR JOURNEY
                <Target className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform" />
              </Button>

              <Button
                onClick={() => navigate("/contact")}
                size="lg"
                variant="outline"
                className="group px-10 py-6 text-lg font-rajdhani font-semibold border-2 border-zinc-700 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-800/60 backdrop-blur transition-all duration-300 text-zinc-200"
              >
                <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                CONTACT US
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default FutureTrading;
