import { useEffect, useState } from "react";
import { Utensils, Terminal, Heart, Dumbbell, RefreshCw, Gamepad2 } from "lucide-react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequence the animation steps
    const timeouts = [
      setTimeout(() => setStep(1), 400),   // EAT
      setTimeout(() => setStep(2), 800),   // CODE
      setTimeout(() => setStep(3), 1200),  // PRAY
      setTimeout(() => setStep(4), 1600),  // TRAIN
      setTimeout(() => setStep(5), 2000),  // REPEAT
      setTimeout(() => setStep(6), 2800),  // PLAY (scratched)
      setTimeout(() => setStep(7), 3800),  // FOCUS
      setTimeout(() => onComplete(), 5500) // Done
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  const items = [
    { label: "EAT", icon: <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />, visibleAt: 1 },
    { label: "CODE", icon: <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />, visibleAt: 2 },
    { label: "PRAY", icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6" />, visibleAt: 3 },
    { label: "TRAIN", icon: <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />, visibleAt: 4 },
    { label: "REPEAT", icon: <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />, visibleAt: 5 },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center text-white font-display overflow-hidden">
      {/* Background grain or gradient if needed */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/20 to-black pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        
        {/* The List */}
        <div className="flex flex-col gap-4 sm:gap-5 w-full items-center mb-10">
          {items.map((item) => (
            <div 
              key={item.label}
              className={`flex items-center w-36 sm:w-40 transition-all duration-700 ease-out transform ${
                step >= item.visibleAt ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <div className="w-12 flex justify-center text-neutral-300">
                {item.icon}
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-[0.25em]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* The Scratched Play */}
        <div className={`flex flex-col items-center mb-10 transition-all duration-700 ease-out transform ${
          step >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}>
           <div className="flex items-center w-36 sm:w-40 mb-6 relative opacity-40">
             {/* Scratch lines */}
             <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-neutral-400 -rotate-3 transform scale-110 z-10"></div>
             <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-neutral-400 rotate-2 transform scale-110 z-10"></div>
             
             <div className="w-12 flex justify-center text-neutral-500">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
             </div>
             <span className="text-lg sm:text-xl font-bold tracking-[0.25em] text-neutral-500">PLAY</span>
           </div>

           <div className="text-center space-y-1.5 sm:space-y-2 mt-2">
              <p className="text-[10px] sm:text-xs tracking-[0.2em] text-neutral-400 uppercase">[ Scratch that, you aren't jack ]</p>
              <p className="text-[10px] sm:text-xs tracking-[0.2em] text-neutral-300 uppercase">Keep putting that work.</p>
           </div>
        </div>

        {/* FOCUS */}
        <div className={`mt-2 transition-all duration-1000 ease-out transform ${
          step >= 7 ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[0.35em] sm:tracking-[0.4em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500 ml-3">
            FOCUS
          </h1>
        </div>

      </div>
    </div>
  );
}
