import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Building, MapPin, Ship } from "lucide-react";

// Import images
import company1 from "@/assets/company-1.jpg";
import company2 from "@/assets/company-2.jpg";
import company3 from "@/assets/company-3.jpg";
import port1 from "@/assets/port-1.jpg";
import port2 from "@/assets/port-2.jpg";
import port3 from "@/assets/port-3.jpg";
import port4 from "@/assets/port-4.jpg";
import refinery1 from "@/assets/refinery-1.jpg";
import refinery2 from "@/assets/refinery-2.jpg";
import refinery3 from "@/assets/refinery-3.jpg";

const ImageGallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const galleryItems = [
    {
      image: port1,
      title: "Rotterdam Port",
      location: "Netherlands",
      type: "Major Port",
      icon: Anchor,
      description: "Europe's largest port handling 469 million tons annually"
    },
    {
      image: refinery1,
      title: "Shell Pernis Refinery",
      location: "Netherlands",
      type: "Refinery",
      icon: Building,
      description: "One of the largest refineries in Europe with 416,000 bpd capacity"
    },
    {
      image: company1,
      title: "ExxonMobil Facility",
      location: "Texas, USA",
      type: "Corporate",
      icon: Building,
      description: "Leading global energy company operations center"
    },
      {
        image: port2,
        title: "Houston Port",
        location: "Houston",
        type: "Major Port",
        icon: Ship,
      description: "World's busiest transshipment hub for petroleum products"
    },
    {
      image: refinery2,
      title: "Saudi Aramco Complex",
      location: "Saudi Arabia",
      type: "Refinery",
      icon: Building,
      description: "Integrated oil and gas facility with massive processing capacity"
    },
    {
      image: port3,
      title: "Houston Ship Channel",
      location: "Texas, USA",
      type: "Major Port",
      icon: Anchor,
      description: "America's largest petrochemical complex and energy corridor"
    },
    {
      image: company2,
      title: "BP Operations Center",
      location: "London, UK",
      type: "Corporate",
      icon: MapPin,
      description: "Global headquarters managing worldwide energy operations"
    },
    {
      image: refinery3,
      title: "Reliance Jamnagar",
      location: "India",
      type: "Refinery",
      icon: Building,
      description: "World's largest refinery complex with 1.24 million bpd capacity"
    },
    {
      image: port4,
      title: "Antwerp Port",
      location: "Belgium",
      type: "Major Port",
      icon: Ship,
      description: "Europe's second-largest port and chemical cluster"
    },
    {
      image: company3,
      title: "Total Energies Hub",
      location: "France",
      type: "Corporate",
      icon: Building,
      description: "Integrated energy company driving sustainable solutions"
    }
  ];

  // Auto-scroll functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryItems.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [galleryItems.length]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Major Port':
        return 'from-water to-primary';
      case 'Refinery':
        return 'from-accent to-gold';
      case 'Corporate':
        return 'from-primary to-accent-green';
      default:
        return 'from-primary to-accent';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Major Port':
        return Anchor;
      case 'Refinery':
        return Building;
      case 'Corporate':
        return MapPin;
      default:
        return Ship;
    }
  };

  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-muted/20 via-background to-muted/10">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in-up">
            <Ship className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">Global Network</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-200">
            Connected
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Explore our extensive network of ports, refineries, and corporate partners across the globe. 
            Real connections, real opportunities, real results.
          </p>
        </div>

        {/* Auto-scrolling Gallery */}
        <div className="relative max-w-6xl mx-auto">
          {/* Main Display */}
          <Card className="group relative h-96 md:h-[500px] overflow-hidden border-0 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl shadow-2xl animate-fade-in-up animation-delay-600">
            {/* Image */}
            <div className="absolute inset-0">
              <img
                src={galleryItems[currentIndex].image}
                alt={galleryItems[currentIndex].title}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-4 mb-4">
                <Badge className={`bg-gradient-to-r ${getTypeColor(galleryItems[currentIndex].type)} text-white px-4 py-2 text-sm font-medium`}>
                  {galleryItems[currentIndex].type}
                </Badge>
                
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTypeColor(galleryItems[currentIndex].type)} flex items-center justify-center`}>
                  {(() => {
                    const IconComponent = galleryItems[currentIndex].icon;
                    return <IconComponent className="w-4 h-4 text-white" />;
                  })()}
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-2">
                {galleryItems[currentIndex].title}
              </h3>
              
              <p className="text-lg text-white/80 mb-3">
                {galleryItems[currentIndex].location}
              </p>
              
              <p className="text-white/70 max-w-2xl">
                {galleryItems[currentIndex].description}
              </p>
            </div>
          </Card>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {galleryItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary scale-125 shadow-lg'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex justify-center mt-6 gap-4 overflow-hidden">
            {galleryItems.map((item, index) => {
              const isActive = index === currentIndex;
              const isPrev = index === (currentIndex - 1 + galleryItems.length) % galleryItems.length;
              const isNext = index === (currentIndex + 1) % galleryItems.length;
              
              if (!isActive && !isPrev && !isNext) return null;
              
              return (
                <Card
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`group cursor-pointer overflow-hidden border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-primary scale-105 shadow-lg' 
                      : 'border-transparent scale-90 opacity-60 hover:opacity-80 hover:scale-95'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-fade-in-up animation-delay-800">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">250+</div>
            <div className="text-muted-foreground">Global Ports</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-accent mb-2">180+</div>
            <div className="text-muted-foreground">Refineries</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gold mb-2">50+</div>
            <div className="text-muted-foreground">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-water mb-2">24/7</div>
            <div className="text-muted-foreground">Global Coverage</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;