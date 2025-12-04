import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlackFridayCountdown = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Countdown 7 days from now
  const getCountdownDate = () => {
    const now = new Date();
    // Add 7 days (7 * 24 * 60 * 60 * 1000 milliseconds)
    const countdownDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    // Set to end of day (23:59:59)
    countdownDate.setHours(23, 59, 59, 999);
    return countdownDate.getTime();
  };
  
  const countdownDate = getCountdownDate();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownDate - now;

      if (distance < 0) {
        // Countdown finished, hide the bar or set to next year
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 sm:top-20 md:top-24 lg:top-[130px] left-0 right-0 z-40 bg-gradient-to-r from-black via-red-950 to-black border-b border-red-500/30 shadow-lg">
      <div className="container mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Sparkle icon and text */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap">
                🎉 BLACK FRIDAY SALE
              </span>
              <span className="hidden sm:inline text-yellow-400 font-semibold text-xs sm:text-sm">
                Up to 70% OFF
              </span>
            </div>
          </div>

          {/* Center - Countdown Timer */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="bg-black/50 rounded px-2 py-1 min-w-[50px] text-center border border-red-500/30">
                <div className="text-yellow-400 font-bold text-sm sm:text-base">
                  {String(timeLeft.days).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Days</div>
              </div>
              <span className="text-red-500 font-bold text-lg">:</span>
              <div className="bg-black/50 rounded px-2 py-1 min-w-[50px] text-center border border-red-500/30">
                <div className="text-yellow-400 font-bold text-sm sm:text-base">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Hours</div>
              </div>
              <span className="text-red-500 font-bold text-lg">:</span>
              <div className="bg-black/50 rounded px-2 py-1 min-w-[50px] text-center border border-red-500/30">
                <div className="text-yellow-400 font-bold text-sm sm:text-base">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Mins</div>
              </div>
              <span className="text-red-500 font-bold text-lg">:</span>
              <div className="bg-black/50 rounded px-2 py-1 min-w-[50px] text-center border border-red-500/30">
                <div className="text-yellow-400 font-bold text-sm sm:text-base">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Secs</div>
              </div>
            </div>
          </div>

          {/* Mobile Countdown - Simplified */}
          <div className="md:hidden flex items-center gap-1">
            <div className="bg-black/50 rounded px-2 py-1 text-center border border-red-500/30">
              <div className="text-yellow-400 font-bold text-xs">
                {String(timeLeft.days)}d {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m
              </div>
            </div>
          </div>

          {/* Right side - CTA Button and Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-2 sm:px-4 h-7 sm:h-8 hidden sm:flex"
              onClick={() => {
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Shop Now
            </Button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Close banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackFridayCountdown;

