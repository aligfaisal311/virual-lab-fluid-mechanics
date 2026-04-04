/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  RotateCcw, 
  Info, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Database,
  FlaskConical,
  Activity,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Camera,
  Send,
  Zap,
  Shield,
  Lock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter,
  ZAxis
} from 'recharts';
import confetti from 'canvas-confetti';
import VenturiSimulation from './components/VenturiSimulation';

// --- TYPES ---

type FlowRegime = 'Laminar' | 'Transitional' | 'Turbulent';

interface TrialData {
  id: number;
  fluid: string;
  flowRate: number;
  vFormula: string;
  velocity: number;
  reFormula: string;
  reynolds: number;
  regime: FlowRegime;
  studentRe?: string;
  studentObservation?: string;
}

interface SocraticQuestion {
  id: string;
  q: string;
  observationPrompt?: string;
  options: string[];
  rationales: string[];
  correct: number;
  reinforcement?: string;
  reinforcing?: SocraticQuestion[];
  corrective?: SocraticQuestion[];
}

interface SocraticLogEntry {
  questionId: string;
  questionText: string;
  answer: string;
  rationale: string;
  isCorrect: boolean;
}

// --- CONSTANTS ---

const RHO = 1000; // Water density kg/m3
const MU = 0.001; // Water dynamic viscosity Pa.s

const EXPERIMENTS = {
  bernoulli: {
    id: 'bernoulli' as const,
    name: 'Bernoulli\'s Theorem',
    icon: <Zap size={16} />,
    sections: [
      "Learning Outcomes",
      "Introduction (Hook)",
      "Exploration (Bernoulli)",
      "Theory: Energy Conservation",
      "Apparatus Details",
      "Simulation: Energy Gradient",
      "Interactive Experiment",
      "Data Verification",
      "Knowledge Check",
      "Final Summary"
    ]
  },
  venturi: {
    id: 'venturi' as const,
    name: 'Venturimeter & Orifice Meter',
    icon: <Activity size={16} />,
    sections: [
      "Learning Outcomes",
      "Introduction",
      "Exploration (Bernoulli)",
      "Theory: Bernoulli's Principle",
      "Venturimeter Apparatus",
      "Orifice Meter Apparatus",
      "Simulation: Flow Measurement",
      "Data Collection",
      "Calculation & Comparison",
      "Knowledge Check",
      "Final Summary"
    ]
  },
  reynolds: {
    id: 'reynolds' as const,
    name: 'Reynolds Experiment',
    icon: <FlaskConical size={16} />,
    sections: [
      "Learning Outcomes",
      "Introduction (Hook)",
      "Exploration (Simulation)",
      "Exploration Analysis",
      "Theory (Reynolds Number)",
      "Apparatus Details",
      "Experimental Procedure",
      "Interactive Experiment",
      "Numerical Problem",
      "Force Ratio Theory",
      "Knowledge Check",
      "Calculation & Analysis",
      "Scaffolding Sheet",
      "Final Task"
    ]
  }
};

// --- COMPONENTS ---

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 800 : -800,
    opacity: 0,
    scale: 0.8,
    rotateY: direction > 0 ? 45 : -45,
    rotateZ: direction > 0 ? 10 : -10
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    rotateZ: 0
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 800 : -800,
    opacity: 0,
    scale: 0.8,
    rotateY: direction < 0 ? 45 : -45,
    rotateZ: direction < 0 ? 10 : -10
  })
};

export default function App() {
  const [activeExpId, setActiveExpId] = useState<'reynolds' | 'venturi' | 'bernoulli'>('bernoulli');
  const activeExp = EXPERIMENTS[activeExpId];
  const sectionNames = activeExp.sections;

  const [section, setSection] = useState(1);
  const [maxSection, setMaxSection] = useState(100);
  const [direction, setDirection] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpMenuOpen, setIsExpMenuOpen] = useState(false);
  
  // Reynolds State
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [socraticLog, setSocraticLog] = useState<SocraticLogEntry[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Simulation State (Reynolds)
  const [velocity, setVelocity] = useState(0.1);
  const [diameter, setDiameter] = useState(0.02);
  const [viscosity, setViscosity] = useState(0.001);
  const [predictionMade, setPredictionMade] = useState(false);
  const [showPredictionBox, setShowPredictionBox] = useState(false);

  // Venturi State
  const [venturiFlowRate, setVenturiFlowRate] = useState(0.001);
  const [venturiTrials, setVenturiTrials] = useState<any[]>([]);

  const reynolds = useMemo(() => (RHO * velocity * diameter) / viscosity, [velocity, diameter, viscosity]);
  
  const regime = useMemo((): FlowRegime => {
    if (reynolds < 2000) return 'Laminar';
    if (reynolds < 4000) return 'Transitional';
    return 'Turbulent';
  }, [reynolds]);

  const progress = (section / sectionNames.length) * 100;

  const nextSection = () => {
    if (section < sectionNames.length) {
      setDirection(1);
      setSection(prev => {
        const next = prev + 1;
        if (next > maxSection) setMaxSection(next);
        return next;
      });
    }
  };

  const prevSection = () => {
    if (section > 1) {
      setDirection(-1);
      setSection(prev => prev - 1);
    }
  };

  const switchExperiment = (id: 'reynolds' | 'venturi' | 'bernoulli') => {
    setActiveExpId(id);
    setSection(1);
    setMaxSection(100);
    setDirection(0);
    setIsExpMenuOpen(false);
    setIsSidebarOpen(false);
  };

  const goToSection = (s: number) => {
    setDirection(s > section ? 1 : -1);
    setSection(s);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans selection:bg-blue-100 relative">
      {/* Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:w-60 lg:shadow-none`}>
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                {activeExp.icon}
              </div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate w-32">{activeExp.name}</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          {/* Experiment Switcher */}
          <div className="relative">
            <button 
              onClick={() => setIsExpMenuOpen(!isExpMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Menu size={14} /> Switch Lab
              </span>
              {isExpMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            <AnimatePresence>
              {isExpMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {Object.values(EXPERIMENTS).map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => switchExperiment(exp.id)}
                      className={`w-full text-left px-4 py-3 text-[10px] font-bold flex items-center gap-3 hover:bg-slate-50 transition-colors ${activeExpId === exp.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                    >
                      <div className={`p-1 rounded ${activeExpId === exp.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        {exp.icon}
                      </div>
                      {exp.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {sectionNames.map((name, i) => {
            return (
              <button
                key={i}
                onClick={() => goToSection(i + 1)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2.5 group ${
                  section === i + 1 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                  section === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  {i + 1}
                </span>
                <span className="truncate flex-1">{name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Progress</span>
            <span className="text-[9px] font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                Section {section}
              </span>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <h2 className="text-xs font-bold text-slate-700 truncate max-w-[150px] sm:max-w-none">{sectionNames[section - 1]}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={prevSection}
              disabled={section === 1}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSection}
              disabled={section === sectionNames.length}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* Card Deck Container */}
        <div className="flex-1 p-4 lg:p-10 flex items-center justify-center relative bg-slate-100/50 perspective-1000 overflow-hidden">
          {/* Side Click Navigation Areas (Laptop) */}
          <button 
            onClick={prevSection}
            disabled={section === 1}
            className="absolute left-0 inset-y-0 w-16 lg:w-32 z-20 cursor-w-resize group hidden md:flex items-center justify-center"
            aria-label="Previous Slide"
          >
            <div className="p-3 bg-white/0 group-hover:bg-white/40 rounded-full transition-all text-slate-400 opacity-0 group-hover:opacity-100">
              <ChevronLeft size={32} />
            </div>
          </button>
          <button 
            onClick={nextSection}
            disabled={section === sectionNames.length}
            className="absolute right-0 inset-y-0 w-16 lg:w-32 z-20 cursor-e-resize group hidden md:flex items-center justify-center"
            aria-label="Next Slide"
          >
            <div className="p-3 bg-white/0 group-hover:bg-white/40 rounded-full transition-all text-slate-400 opacity-0 group-hover:opacity-100">
              <ChevronRight size={32} />
            </div>
          </button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={section}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                const swipeThreshold = 100;
                if (info.offset.x < -swipeThreshold && section < sectionNames.length) {
                  nextSection();
                } else if (info.offset.x > swipeThreshold && section > 1) {
                  prevSection();
                }
              }}
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full max-w-5xl h-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden touch-none"
            >
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                {activeExpId === 'bernoulli' ? (
                  <BernoulliLab
                    section={section}
                    onNext={nextSection}
                    onPrev={prevSection}
                  />
                ) : activeExpId === 'reynolds' ? (
                  <ReynoldsLab
                    section={section}
                    onNext={nextSection}
                    onPrev={prevSection}
                    velocity={velocity} setVelocity={setVelocity}
                    diameter={diameter} setDiameter={setDiameter}
                    viscosity={viscosity} setViscosity={setViscosity}
                    reynolds={reynolds} regime={regime}
                    predictionMade={predictionMade} setPredictionMade={setPredictionMade}
                    showPredictionBox={showPredictionBox} setShowPredictionBox={setShowPredictionBox}
                    socraticLog={socraticLog} setSocraticLog={setSocraticLog}
                    trials={trials} setTrials={setTrials}
                    setQuizCompleted={setQuizCompleted}
                  />
                ) : (
                  <VenturiLab 
                    section={section} 
                    onNext={nextSection} 
                    onPrev={prevSection}
                    flowRate={venturiFlowRate}
                    setFlowRate={setVenturiFlowRate}
                    trials={venturiTrials}
                    setTrials={setVenturiTrials}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

// --- SECTION COMPONENTS ---

// --- UTILS ---

function CardStepper({ cards, onComplete, onPrevSection, slidePrefix, nextDisabled = false }: { cards: React.ReactNode[], onComplete: () => void, onPrevSection?: () => void, slidePrefix?: string, nextDisabled?: boolean }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    if (nextDisabled && index === cards.length - 1) return;
    if (index < cards.length - 1) {
      setDirection(1);
      setIndex(index + 1);
    } else {
      onComplete();
    }
  };

  const back = () => {
    if (index > 0) {
      setDirection(-1);
      setIndex(index - 1);
    } else if (onPrevSection) {
      onPrevSection();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="relative min-h-[400px] flex flex-col">
      <div className="relative flex-grow overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                next();
              } else if (swipe > swipeConfidenceThreshold) {
                back();
              }
            }}
            className="w-full h-full"
          >
            {cards[index]}
          </motion.div>
        </AnimatePresence>

        {/* Desktop invisible click areas */}
        <div 
          className="hidden lg:block absolute inset-y-0 left-0 w-16 cursor-pointer z-10 hover:bg-slate-500/5 transition-colors" 
          onClick={(e) => { e.stopPropagation(); back(); }}
          title="Previous"
        />
        <div 
          className="hidden lg:block absolute inset-y-0 right-0 w-16 cursor-pointer z-10 hover:bg-slate-500/5 transition-colors" 
          onClick={(e) => { e.stopPropagation(); next(); }}
          title="Next"
        />
      </div>
      
      {/* Navigation Controls */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button onClick={back} className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center">
          <ChevronLeft size={20} /> Back
        </button>
        
        {/* Progress dots */}
        <div className="flex flex-col items-center gap-2 order-first sm:order-none">
          {slidePrefix && (
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Slide {slidePrefix}.{index + 1}
            </span>
          )}
          <div className="flex gap-2">
            {cards.map((_, i) => (
              <button 
                key={i} 
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === index ? 'bg-blue-600 w-6' : 'bg-slate-200 hover:bg-slate-300'}`} 
              />
            ))}
          </div>
        </div>

        <button 
          onClick={next} 
          disabled={nextDisabled && index === cards.length - 1}
          className={`btn-primary flex items-center gap-2 w-full sm:w-auto justify-center transition-all ${nextDisabled && index === cards.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {index === cards.length - 1 ? (
            <>
              {nextDisabled ? <Lock size={18} /> : <CheckCircle2 size={18} />}
              {nextDisabled ? 'Complete Task to Continue' : 'Continue'}
            </>
          ) : (
            <>Next <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}


// --- BERNOULLI LAB COMPONENTS ---

function BernoulliLab({ section, onNext, onPrev }: any) {
  const prefix = `1.${section}`;
  switch (section) {
    case 1: return <BernoulliSection1 onNext={onNext} slidePrefix={prefix} />;
    case 2: return <BernoulliSection2 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 3: return <VenturiSectionExploration onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 4: return <BernoulliSection3 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 5: return <BernoulliSection4 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 6: return <BernoulliSection5 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 7: return <BernoulliSection6 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 8: return <BernoulliSection7 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 9: return <BernoulliSection8 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 10: return <BernoulliSection9 onPrev={onPrev} slidePrefix={prefix} />;
    default: return null;
  }
}

function BernoulliSection1({ onNext }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Learning Outcomes</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { icon: <Zap className="text-blue-600" />, title: "Energy Conservation", desc: "Understand how energy is conserved in a moving fluid." },
            { icon: <Activity className="text-emerald-600" />, title: "Bernoulli's Equation", desc: "Learn to apply the equation to calculate pressure and velocity changes." },
            { icon: <Database className="text-amber-600" />, title: "Total Head Verification", desc: "Experimentally verify that the sum of pressure and velocity heads is constant." },
            { icon: <Shield className="text-rose-600" />, title: "Practical Application", desc: "See how this principle powers aircraft wings and flow meters." }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
              <div className="shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-end">
          <button onClick={onNext} className="btn-primary">Start Lab</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection2({ onNext, onPrev }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-6">The "Magic" of Fluid Pressure</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-slate-600 leading-relaxed">
              Have you ever wondered how a massive airplane stays in the sky? Or why a shower curtain gets sucked towards you when the water is running?
            </p>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-blue-900 font-medium">
                "As the speed of a moving fluid increases, the pressure within the fluid decreases."
              </p>
            </div>
            <p className="text-slate-600 leading-relaxed">
              This is <b>Bernoulli's Principle</b>. It's not magic—it's the conservation of energy. In this lab, we will prove it mathematically and experimentally.
            </p>
          </div>
          <div className="bg-slate-900 rounded-3xl p-8 aspect-video flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-400 blur-sm" />
                <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-400 blur-md translate-y-4" />
                <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-400 blur-lg -translate-y-4" />
             </div>
             <motion.div 
               animate={{ y: [0, -20, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-center"
             >
                <Zap size={48} className="text-blue-400 mx-auto mb-4" />
                <p className="text-white font-bold">Energy in Motion</p>
             </motion.div>
          </div>
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">Explore Theory</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection3({ onNext, onPrev }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">The Energy Equation</h2>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <p className="text-lg text-slate-600 leading-relaxed">
              For an incompressible, non-viscous fluid in a steady flow, the total energy remains constant along a streamline.
            </p>
            <div className="p-8 bg-slate-900 rounded-3xl text-white text-center shadow-xl">
              <p className="text-2xl font-serif italic mb-4">P/ρg + v²/2g + z = Constant</p>
              <div className="grid grid-cols-3 gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <div>Pressure Head</div>
                <div>Velocity Head</div>
                <div>Datum Head</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3">
                <div className="text-emerald-600"><Info size={20} /></div>
                <p className="text-emerald-900 text-sm"><b>Pressure Head:</b> Energy due to static pressure.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <div className="text-blue-600"><Info size={20} /></div>
                <p className="text-blue-900 text-sm"><b>Velocity Head:</b> Kinetic energy of the fluid.</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Key Insights</h3>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                If velocity increases (narrow pipe), pressure must decrease to keep the total energy constant.
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                In a horizontal pipe, we ignore 'z' (datum head).
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Real fluids have friction, causing a slight "Head Loss" over distance.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">View Apparatus</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection4({ onNext, onPrev }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Experimental Apparatus</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Components</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <b>Convergent-Divergent Duct:</b> A pipe with varying cross-section.
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <b>Piezometer Tubes:</b> Vertical tubes to measure static pressure (Pressure Head).
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <b>Inlet & Outlet Tanks:</b> To maintain steady flow.
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <b>Control Valve:</b> To adjust the flow rate.
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-slate-100 rounded-3xl p-8 aspect-square flex items-center justify-center border border-slate-200">
             <div className="w-full h-full relative">
                {/* Simple SVG diagram of Bernoulli apparatus */}
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  {/* Main Pipe */}
                  <path d="M 50 150 L 150 150 L 200 170 L 250 150 L 350 150" fill="none" stroke="#64748b" strokeWidth="20" opacity="0.3" />
                  <path d="M 50 150 L 150 150 L 200 170 L 250 150 L 350 150" fill="none" stroke="#3b82f6" strokeWidth="16" />
                  
                  {/* Manometers */}
                  {[80, 130, 200, 270, 320].map((x, i) => {
                    const h = i === 2 ? 100 : (i === 1 || i === 3 ? 60 : 40);
                    return (
                      <g key={i}>
                        <line x1={x} y1={150} x2={x} y2={150 - h} stroke="#94a3b8" strokeWidth="2" />
                        <rect x={x-2} y={150-h} width="4" height={h} fill="#3b82f6" opacity="0.5" />
                      </g>
                    )
                  })}
                  
                  <text x="50" y="180" fontSize="10" fill="#64748b" fontWeight="bold">INLET</text>
                  <text x="310" y="180" fontSize="10" fill="#64748b" fontWeight="bold">OUTLET</text>
                  <text x="185" y="200" fontSize="10" fill="#3b82f6" fontWeight="bold">THROAT</text>
                </svg>
             </div>
          </div>
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">Start Simulation</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection5({ onNext, onPrev }: any) {
  const [flowRate, setFlowRate] = useState(0.5);
  
  // Calculate heights for 5 points
  // Point 3 is throat (narrowest)
  const getHeights = (q: number) => {
    const baseH = 200;
    const drop = q * 100;
    return [
      baseH - drop * 0.2,
      baseH - drop * 0.5,
      baseH - drop * 1.0, // Throat
      baseH - drop * 0.5,
      baseH - drop * 0.2
    ];
  };

  const heights = getHeights(flowRate);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Simulation: Energy Gradient</h2>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-sm font-bold text-slate-700 block mb-4">Adjust Flow Rate (Q)</label>
              <input 
                type="range" min="0.1" max="1.0" step="0.05" 
                value={flowRate} onChange={(e) => setFlowRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Low Flow</span>
                <span>High Flow</span>
              </div>
            </div>
            
            <div className="space-y-4">
               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-blue-900 font-bold text-sm">Observation</p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Notice how the water level in the manometers drops as the pipe narrows (at the throat). This indicates a drop in static pressure.
                  </p>
               </div>
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-emerald-900 font-bold text-sm">Energy Fact</p>
                  <p className="text-emerald-700 text-xs leading-relaxed">
                    The fluid speeds up at the throat. Kinetic energy increases, so pressure energy must decrease.
                  </p>
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-full max-w-lg relative">
                {/* Manometer tubes */}
                <div className="flex justify-between items-end h-64 px-12 mb-4 relative z-10">
                   {heights.map((h, i) => (
                     <div key={i} className="w-4 bg-blue-400/20 border-x border-white/10 relative flex flex-col justify-end">
                        <motion.div 
                          initial={false}
                          animate={{ height: h }}
                          className="w-full bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] relative"
                        >
                           <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">h{i+1}</div>
                        </motion.div>
                     </div>
                   ))}
                </div>
                
                {/* Pipe */}
                <div className="h-12 bg-white/10 rounded-full border border-white/20 relative overflow-hidden">
                   <motion.div 
                     animate={{ x: [-20, 0] }}
                     transition={{ duration: 0.5 / flowRate, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 flex"
                   >
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-full w-20 border-r border-white/5 shrink-0" />
                      ))}
                   </motion.div>
                   {/* Throat narrowing effect */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1/3 h-full bg-slate-900/40 backdrop-blur-sm rounded-full scale-y-50" />
                   </div>
                </div>
                
                {/* Labels */}
                <div className="flex justify-between mt-4 px-12 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   <span>Inlet</span>
                   <span>Throat</span>
                   <span>Outlet</span>
                </div>
             </div>
          </div>
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">Interactive Experiment</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection6({ onNext, onPrev }: any) {
  const [trials, setTrials] = useState<any[]>([]);
  const [flowRate, setFlowRate] = useState(0.5);

  const addTrial = () => {
    const baseH = 250;
    const drop = flowRate * 120;
    const h1 = baseH - drop * 0.2;
    const h2 = baseH - drop * 1.0; // Throat
    const v1 = flowRate * 2;
    const v2 = flowRate * 6; // Higher velocity at throat
    
    const newTrial = {
      id: trials.length + 1,
      q: flowRate.toFixed(2),
      h1: h1.toFixed(1),
      h2: h2.toFixed(1),
      v1: v1.toFixed(2),
      v2: v2.toFixed(2),
      total1: (parseFloat(h1.toFixed(1)) + (v1*v1)/(2*9.81)*100).toFixed(1),
      total2: (parseFloat(h2.toFixed(1)) + (v2*v2)/(2*9.81)*100).toFixed(1)
    };
    setTrials([...trials, newTrial]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Interactive Experiment</h2>
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-sm font-bold text-slate-700 block mb-4">Flow Control</label>
              <input 
                type="range" min="0.2" max="0.8" step="0.1" 
                value={flowRate} onChange={(e) => setFlowRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <button onClick={addTrial} className="w-full btn-primary mt-6 flex items-center justify-center gap-2">
                <Database size={18} /> Record Data
              </button>
            </div>
            <p className="text-xs text-slate-500 italic">Record at least 3 trials with different flow rates to verify the theorem.</p>
          </div>
          
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Trial</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Q (L/s)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">h1 (mm)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">h2 (mm)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">v1 (m/s)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">v2 (m/s)</th>
                </tr>
              </thead>
              <tbody>
                {trials.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm">{t.id}</td>
                    <td className="py-3 px-4 font-mono text-sm">{t.q}</td>
                    <td className="py-3 px-4 font-mono text-sm">{t.h1}</td>
                    <td className="py-3 px-4 font-mono text-sm text-blue-600">{t.h2}</td>
                    <td className="py-3 px-4 font-mono text-sm">{t.v1}</td>
                    <td className="py-3 px-4 font-mono text-sm text-emerald-600">{t.v2}</td>
                  </tr>
                ))}
                {trials.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">No data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">
            <CheckCircle2 size={18} className="mr-2 inline" />
            Verify Total Head
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection7({ onNext, onPrev }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Data Verification</h2>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <p className="text-lg text-slate-600 leading-relaxed">
              Now, let's check if the <b>Total Head</b> remained constant between the Inlet and the Throat.
            </p>
            <div className="p-6 bg-slate-900 rounded-2xl text-white">
              <p className="text-sm font-bold text-slate-400 uppercase mb-4">Verification Formula</p>
              <p className="text-xl font-serif italic">H_total = h + v²/2g</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
               <h3 className="font-bold text-emerald-900 mb-2">Conclusion</h3>
               <p className="text-emerald-800 text-sm leading-relaxed">
                 Even though the pressure (h) decreased at the throat, the velocity (v) increased significantly. The sum of these two energies remains nearly identical at both points, proving Bernoulli's Theorem.
               </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-center">
             <div className="space-y-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl">1</div>
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Inlet Total Head</p>
                      <p className="text-lg font-bold text-slate-800">h1 + v1²/2g ≈ 255 mm</p>
                   </div>
                </div>
                <div className="h-px bg-slate-200 w-full" />
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-xl">2</div>
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Throat Total Head</p>
                      <p className="text-lg font-bold text-slate-800">h2 + v2²/2g ≈ 252 mm</p>
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">*Small difference is due to minor head losses (friction).</p>
             </div>
          </div>
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">Take Quiz</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection8({ onNext, onPrev }: any) {
  const [answers, setAnswers] = useState<number[]>([]);
  const questions = [
    {
      q: "According to Bernoulli's principle, if the velocity of a fluid increases, what happens to its static pressure?",
      options: ["It increases", "It decreases", "It remains constant", "It doubles"],
      correct: 1
    },
    {
      q: "Which term in Bernoulli's equation represents the kinetic energy per unit weight?",
      options: ["P/ρg", "z", "v²/2g", "ρgh"],
      correct: 2
    },
    {
      q: "In a horizontal pipe, which energy component is usually neglected?",
      options: ["Pressure Head", "Velocity Head", "Datum Head", "Total Head"],
      correct: 2
    }
  ];

  const handleSelect = (qIdx: number, oIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = oIdx;
    setAnswers(newAnswers);
  };

  const isComplete = answers.filter(a => a !== undefined).length === questions.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Knowledge Check</h2>
        <div className="space-y-8">
          {questions.map((q, i) => (
            <div key={i} className="space-y-4">
              <p className="font-bold text-slate-800">{i+1}. {q.q}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {q.options.map((opt, j) => (
                  <button 
                    key={j}
                    onClick={() => handleSelect(i, j)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      answers[i] === j 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-between">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button onClick={onNext} className="btn-primary">Final Summary</button>
        </div>
      </div>
    </motion.div>
  );
}

function BernoulliSection9({ onPrev }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-8">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-4xl font-bold mb-4">Lab Complete!</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-12">
          You have successfully explored Bernoulli's Theorem. You've seen how energy transforms between pressure and velocity, and verified that the total energy remains constant in a steady flow.
        </p>
        
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-800">100%</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Verification</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-800">3/3</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Quiz Score</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-800">Energy</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Conserved</p>
           </div>
        </div>

        <div className="flex justify-center gap-4">
          <button onClick={onPrev} className="btn-secondary">Review Lab</button>
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
            <Database size={18} /> Download Lab Report
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiLab({ section, onNext, onPrev, flowRate, setFlowRate, trials, setTrials }: any) {
  const prefix = `2.${section}`;
  switch (section) {
    case 1: return <VenturiSection1 onNext={onNext} slidePrefix={prefix} />;
    case 2: return <VenturiSection2 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 3: return <VenturiSectionExploration onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 4: return <VenturiSection3 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 5: return <VenturiSection4 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 6: return <VenturiSection5 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 7: return <VenturiSection6 onNext={onNext} onPrev={onPrev} flowRate={flowRate} setFlowRate={setFlowRate} slidePrefix={prefix} />;
    case 8: return <VenturiSection7 onNext={onNext} onPrev={onPrev} trials={trials} setTrials={setTrials} flowRate={flowRate} slidePrefix={prefix} />;
    case 9: return <VenturiSection8 onNext={onNext} onPrev={onPrev} trials={trials} slidePrefix={prefix} />;
    case 10: return <VenturiSection9 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 11: return <VenturiSection10 onPrev={onPrev} slidePrefix={prefix} />;
    default: return null;
  }
}

function VenturiSection1({ onNext, slidePrefix }: { onNext: () => void, slidePrefix: string }) {
  const cards = [
    (
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
            <Activity size={40} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Venturimeter & Orifice Meter Lab</h1>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed">
          Welcome to the Flow Measurement Lab. In this experiment, you will explore how pressure differences are used to measure the flow rate of fluids in pipes.
        </p>
        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
          <p className="text-indigo-800 font-medium">
            "Energy can neither be created nor destroyed; it can only be changed from one form to another." — Law of Conservation of Energy
          </p>
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Learning Outcomes</h2>
        <div className="grid gap-4">
          <OutcomeCard 
            title="Bernoulli's Principle" 
            desc="Understand the relationship between fluid velocity and pressure in a constricted flow." 
          />
          <OutcomeCard 
            title="Applying" 
            desc="Compare the working principles and efficiency of Venturimeters and Orifice meters." 
          />
        </div>
      </div>
    )
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function VenturiSection2({ onNext, onPrev, slidePrefix }: any) {
  const cards = [
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-8">Why Measure Flow?</h2>
        <p className="text-slate-600 leading-relaxed">
          In industries, knowing exactly how much fluid is moving through a pipe is critical. Whether it's oil in a pipeline, water in a city's network, or fuel in an engine.
        </p>
        <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
          <div className="text-center p-8">
            <Activity size={48} className="mx-auto text-indigo-500 mb-4" />
            <p className="text-slate-500 font-medium">Visualization: Flow in a complex piping system</p>
          </div>
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-8">The Challenge</h2>
        <p className="text-slate-600 leading-relaxed">
          How do you measure flow without putting a "speedometer" inside the pipe that might break or block the flow?
        </p>
        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-amber-800 font-medium italic">
            "We use the fluid's own energy changes to tell us its speed."
          </p>
        </div>
      </div>
    )
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} onPrevSection={onPrev} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function VenturiSectionExploration({ onNext, onPrev, slidePrefix }: any) {
  const [params, setParams] = useState({
    constrictionRatio: 0.5,
    inletVelocity: 2.0,
    fluidDensity: 1000
  });

  const cards = [
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-4">Interactive Exploration</h2>
        <p className="text-slate-600 text-sm">
          Adjust the parameters below to see how the pipe geometry and fluid properties affect velocity and pressure.
        </p>
        
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Constriction Ratio (A2/A1)</span>
                <input 
                  type="range" min="0.3" max="0.8" step="0.05" 
                  value={params.constrictionRatio} 
                  onChange={(e) => setParams(p => ({ ...p, constrictionRatio: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Narrow (0.3)</span>
                  <span className="text-indigo-600 font-bold">{params.constrictionRatio.toFixed(2)}</span>
                  <span>Wide (0.8)</span>
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inlet Velocity (v1)</span>
                <input 
                  type="range" min="0.5" max="5.0" step="0.1" 
                  value={params.inletVelocity} 
                  onChange={(e) => setParams(p => ({ ...p, inletVelocity: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Slow (0.5 m/s)</span>
                  <span className="text-indigo-600 font-bold">{params.inletVelocity.toFixed(1)} m/s</span>
                  <span>Fast (5.0 m/s)</span>
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fluid Density (ρ)</span>
                <select 
                  value={params.fluidDensity} 
                  onChange={(e) => setParams(p => ({ ...p, fluidDensity: parseInt(e.target.value) }))}
                  className="w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="800">Oil (800 kg/m³)</option>
                  <option value="1000">Water (1000 kg/m³)</option>
                  <option value="1260">Glycerin (1260 kg/m³)</option>
                </select>
              </label>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Observation</h4>
              <p className="text-xs text-indigo-900 leading-relaxed">
                Notice how the <strong>Throat Pressure</strong> drops significantly as you increase the velocity or decrease the constriction ratio. This is the Venturi effect in action!
              </p>
            </div>
          </div>

          <VenturiSimulation params={params} />
        </div>
      </div>
    )
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} onPrevSection={onPrev} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function VenturiSection3({ onNext, onPrev, slidePrefix }: any) {
  const cards = [
    (
      <div className="space-y-6 text-center">
        <h2 className="text-3xl font-bold mb-8">Bernoulli's Principle</h2>
        <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-xl border-4 border-slate-800 inline-block mx-auto">
          <div className="text-2xl font-serif italic flex items-center gap-4">
            <span>P₁ + ½ρv₁² + ρgh₁ = P₂ + ½ρv₂² + ρgh₂</span>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed mt-6">
          For a horizontal pipe (h₁ = h₂), as the velocity (v) increases, the pressure (P) must decrease to keep the total energy constant.
        </p>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">The Constriction Effect</h2>
        <p className="text-slate-600 leading-relaxed">
          When fluid enters a narrower part of a pipe (a constriction), it <strong>speeds up</strong> (Continuity Equation: A₁v₁ = A₂v₂).
        </p>
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-full text-white">
            <Info size={24} />
          </div>
          <p className="text-blue-800 font-medium">
            Faster speed at the throat = Lower pressure at the throat.
          </p>
        </div>
      </div>
    )
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} onPrevSection={onPrev} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function VenturiSection4({ onNext, onPrev, slidePrefix }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">The Venturimeter</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-slate-600 leading-relaxed">
              A Venturimeter is a device with a converging part, a throat, and a diverging part. It is designed to be <strong>aerodynamic</strong> to minimize energy loss.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="text-emerald-500" size={18} /> High accuracy
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="text-emerald-500" size={18} /> Low pressure loss
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="text-emerald-500" size={18} /> Expensive to manufacture
              </li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 aspect-square flex items-center justify-center">
             {/* SVG Illustration of Venturimeter */}
             <svg viewBox="0 0 400 200" className="w-full h-auto">
                <path d="M 20 60 L 120 60 L 180 90 L 220 90 L 320 60 L 380 60" fill="none" stroke="#334155" strokeWidth="4" />
                <path d="M 20 140 L 120 140 L 180 110 L 220 110 L 320 140 L 380 140" fill="none" stroke="#334155" strokeWidth="4" />
                <line x1="150" y1="60" x2="150" y2="20" stroke="#94a3b8" strokeWidth="2" />
                <line x1="200" y1="90" x2="200" y2="20" stroke="#94a3b8" strokeWidth="2" />
                <text x="150" y="15" textAnchor="middle" fontSize="12" fill="#64748b">P1</text>
                <text x="200" y="15" textAnchor="middle" fontSize="12" fill="#64748b">P2</text>
             </svg>
          </div>
        </div>
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary">Next: Orifice Meter</button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiSection5({ onNext, onPrev, slidePrefix }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">The Orifice Meter</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 aspect-square flex items-center justify-center">
             {/* SVG Illustration of Orifice Meter */}
             <svg viewBox="0 0 400 200" className="w-full h-auto">
                <line x1="20" y1="60" x2="380" y2="60" stroke="#334155" strokeWidth="4" />
                <line x1="20" y1="140" x2="380" y2="140" stroke="#334155" strokeWidth="4" />
                <rect x="195" y="60" width="10" height="30" fill="#334155" />
                <rect x="195" y="110" width="10" height="30" fill="#334155" />
                <line x1="150" y1="60" x2="150" y2="20" stroke="#94a3b8" strokeWidth="2" />
                <line x1="220" y1="100" x2="220" y2="20" stroke="#94a3b8" strokeWidth="2" />
                <text x="150" y="15" textAnchor="middle" fontSize="12" fill="#64748b">P1</text>
                <text x="220" y="15" textAnchor="middle" fontSize="12" fill="#64748b">P2</text>
             </svg>
          </div>
          <div className="space-y-6">
            <p className="text-slate-600 leading-relaxed">
              An Orifice meter is simply a flat plate with a hole in it. It creates a sudden constriction, which causes <strong>turbulence and energy loss</strong>.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <AlertCircle className="text-amber-500" size={18} /> Lower accuracy
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <AlertCircle className="text-amber-500" size={18} /> High pressure loss
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="text-emerald-500" size={18} /> Very cheap and easy to install
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary">Start Simulation</button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiSection6({ onNext, onPrev, flowRate, setFlowRate, slidePrefix }: any) {
  const h1 = 150;
  const h2_venturi = h1 - (flowRate * 50000);
  const h2_orifice = h1 - (flowRate * 80000);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Flow Simulation</h2>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-4">Control Flow Rate (Q)</label>
              <input 
                type="range" min="0.0001" max="0.002" step="0.0001" 
                value={flowRate} onChange={(e) => setFlowRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                <span>LOW</span>
                <span>HIGH</span>
              </div>
              <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Actual Flow Rate</p>
                <p className="text-2xl font-mono font-bold text-indigo-600">{(flowRate * 1000).toFixed(2)} L/s</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> Venturimeter
                </h3>
                <div className="h-48 bg-slate-900 rounded-2xl relative flex items-end justify-around p-4 border-4 border-slate-800">
                  <div className="w-8 bg-blue-500/40 border-t-2 border-blue-400" style={{ height: `${h1}px` }} />
                  <div className="w-8 bg-blue-500/40 border-t-2 border-blue-400" style={{ height: `${h2_venturi}px` }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-white/40 font-bold">Manometer Δh: {(h1 - h2_venturi).toFixed(1)} mm</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Activity size={16} className="text-amber-500" /> Orifice Meter
                </h3>
                <div className="h-48 bg-slate-900 rounded-2xl relative flex items-end justify-around p-4 border-4 border-slate-800">
                  <div className="w-8 bg-blue-500/40 border-t-2 border-blue-400" style={{ height: `${h1}px` }} />
                  <div className="w-8 bg-blue-500/40 border-t-2 border-blue-400" style={{ height: `${h2_orifice}px` }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-white/40 font-bold">Manometer Δh: {(h1 - h2_orifice).toFixed(1)} mm</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">Observe how the pressure drop (Δh) increases as you increase the flow rate. Notice that the Orifice meter creates a larger drop for the same flow.</p>
          </div>
        </div>
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary">Go to Data Collection</button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiSection7({ onNext, onPrev, trials, setTrials, flowRate, slidePrefix }: any) {
  const addTrial = () => {
    const h1 = 150;
    const h2_v = h1 - (flowRate * 50000);
    const h2_o = h1 - (flowRate * 80000);
    const newTrial = {
      id: trials.length + 1,
      actualQ: flowRate * 1000,
      dh_v: h1 - h2_v,
      dh_o: h1 - h2_o
    };
    setTrials([...trials, newTrial]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Data Collection</h2>
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <button onClick={addTrial} className="w-full btn-primary py-4 flex items-center justify-center gap-2">
              <Database size={20} /> Record Current Data
            </button>
            <p className="text-xs text-slate-500">Adjust the flow rate in the previous section or use the slider below to collect multiple data points.</p>
          </div>
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Trial</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Actual Q (L/s)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase text-indigo-600">Δh Venturi (mm)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase text-amber-600">Δh Orifice (mm)</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm">{t.id}</td>
                    <td className="py-3 px-4 font-mono text-sm">{t.actualQ.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-sm text-indigo-600">{t.dh_v.toFixed(1)}</td>
                    <td className="py-3 px-4 font-mono text-sm text-amber-600">{t.dh_o.toFixed(1)}</td>
                  </tr>
                ))}
                {trials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 italic">No data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary">Next: Analysis</button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiSection8({ onNext, onPrev, trials, slidePrefix }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Calculation & Comparison</h2>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
             <h3 className="text-xl font-bold text-slate-800">The Discharge Coefficient (Cd)</h3>
             <p className="text-slate-600 leading-relaxed">
               The theoretical flow rate is always higher than the actual flow rate due to friction. We use Cd to correct this:
             </p>
             <div className="p-6 bg-slate-900 rounded-2xl text-white text-center">
                <p className="text-2xl font-serif italic">Q_actual = Cd × Q_theoretical</p>
             </div>
             <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                   <p className="text-indigo-900 font-bold">Venturimeter Cd ≈ 0.98</p>
                   <p className="text-indigo-700 text-xs">Very efficient, minimal energy loss.</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                   <p className="text-amber-900 font-bold">Orifice Meter Cd ≈ 0.62</p>
                   <p className="text-amber-700 text-xs">Significant energy loss due to sudden contraction.</p>
                </div>
             </div>
          </div>
          <div className="h-64 sm:h-auto">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trials}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="actualQ" label={{ value: 'Flow Rate (L/s)', position: 'insideBottom', offset: -5 }} />
                   <YAxis label={{ value: 'Δh (mm)', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Line type="monotone" dataKey="dh_v" stroke="#4f46e5" strokeWidth={3} name="Venturi" dot={{ r: 4 }} />
                   <Line type="monotone" dataKey="dh_o" stroke="#f59e0b" strokeWidth={3} name="Orifice" dot={{ r: 4 }} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary">Final Quiz</button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiSection9({ onNext, onPrev, slidePrefix }: any) {
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const question = {
    q: "Why is the Coefficient of Discharge (Cd) for a Venturimeter higher than that of an Orifice meter?",
    options: [
      "A. Venturimeter is cheaper",
      "B. Venturimeter has a streamlined design with less pressure loss",
      "C. Orifice meter has a larger diameter",
      "D. Venturimeter is made of better material"
    ],
    correct: 1
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-3">
          <HelpCircle className="text-indigo-500" /> Knowledge Check
        </h2>
        <div className="space-y-6">
          <p className="text-lg font-medium text-slate-700">{question.q}</p>
          <div className="grid gap-3">
            {question.options.map((opt, i) => (
              <button
                key={i}
                disabled={answered}
                onClick={() => { setSelected(i); setAnswered(true); }}
                className={`p-4 rounded-xl text-left border-2 transition-all ${
                  answered 
                    ? i === question.correct 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : i === selected 
                        ? 'bg-rose-50 border-rose-500 text-rose-700' 
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl ${selected === question.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {selected === question.correct ? "Correct! The streamlined shape minimizes turbulence and energy loss." : "Incorrect. The primary reason is the streamlined design which reduces pressure loss."}
            </motion.div>
          )}
        </div>
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary">Finish Lab</button>
        </div>
      </div>
    </motion.div>
  );
}

function VenturiSection10({ onPrev, slidePrefix }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-bold mb-4">Lab Complete!</h2>
        <p className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto">
          You have successfully explored the principles of flow measurement using Venturimeters and Orifice meters. You've seen how Bernoulli's principle is applied in engineering to measure fluid flow.
        </p>
        <div className="flex justify-center items-center gap-8">
          <button onClick={onPrev} className="btn-secondary">Review Lab</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={() => window.location.reload()} className="btn-primary flex items-center gap-2">
            <RotateCcw size={18} /> Restart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- REYNOLDS LAB COMPONENTS ---

function ReynoldsLab({ 
  section, onNext, onPrev, 
  velocity, setVelocity, diameter, setDiameter, viscosity, setViscosity, 
  reynolds, regime, predictionMade, setPredictionMade, showPredictionBox, setShowPredictionBox,
  socraticLog, setSocraticLog, trials, setTrials, setQuizCompleted
}: any) {
  const prefix = `3.${section}`;
  switch (section) {
    case 1: return <Section1 onNext={onNext} slidePrefix={prefix} />;
    case 2: return <Section2 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 3: return (
      <Section3 
        velocity={velocity} setVelocity={setVelocity}
        diameter={diameter} setDiameter={setDiameter}
        viscosity={viscosity} setViscosity={setViscosity}
        reynolds={reynolds} regime={regime}
        predictionMade={predictionMade} setPredictionMade={setPredictionMade}
        showPredictionBox={showPredictionBox} setShowPredictionBox={setShowPredictionBox}
        onNext={onNext} onPrev={onPrev} 
        slidePrefix={prefix}
      />
    );
    case 4: return <Section4 onNext={onNext} onPrev={onPrev} log={socraticLog} setLog={setSocraticLog} slidePrefix={prefix} />;
    case 5: return <Section5 onNext={onNext} onPrev={onPrev} log={socraticLog} setLog={setSocraticLog} slidePrefix={prefix} />;
    case 6: return <Section6 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 7: return <Section7 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 8: return (
      <Section8 
        trials={trials} setTrials={setTrials} 
        currentData={{ velocity, reynolds, regime }}
        onNext={onNext} onPrev={onPrev} 
        slidePrefix={prefix}
      />
    );
    case 9: return <Section9Numerical onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 10: return <Section10ForceRatio onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 11: return (
      <Section9 
        onComplete={() => { setQuizCompleted(true); onNext(); }} 
        onPrev={onPrev} 
        log={socraticLog} setLog={setSocraticLog} 
        slidePrefix={prefix}
      />
    );
    case 12: return <Section10 trials={trials} onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 13: return <Section11 onNext={onNext} onPrev={onPrev} slidePrefix={prefix} />;
    case 14: return <Section12 onPrev={onPrev} slidePrefix={prefix} />;
    default: return null;
  }
}

function Section1({ onNext, slidePrefix }: { onNext: () => void, slidePrefix: string }) {
  const cards = [
    (
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
            <FlaskConical size={40} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Reynolds Experiment Lab</h1>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed">
          Welcome to the Virtual Reynolds Apparatus. In this lab, you will explore the fundamental transition between laminar and turbulent flow.
        </p>
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-blue-800 font-medium">
            "Science is a way of thinking much more than it is a body of knowledge." — Carl Sagan
          </p>
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Learning Outcomes</h2>
        <div className="grid gap-4">
          <OutcomeCard 
            title="Conceptual Understanding" 
            desc="Distinguish between laminar, transitional, and turbulent flow regimes through visual observation." 
          />
          <OutcomeCard 
            title="Applying" 
            desc="Calculate the Reynolds Number and predict flow behavior based on fluid properties and pipe geometry." 
          />
        </div>
      </div>
    )
  ];

  return (
    <motion.div 
      key="s1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function OutcomeCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="mt-1 text-blue-600">
        <CheckCircle2 size={20} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Section2({ onNext, onPrev, slidePrefix }: { onNext: () => void; onPrev: () => void; slidePrefix: string }) {
  const cards = [
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-8">The Mystery of the Tap</h2>
        <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden border-4 border-slate-800 shadow-xl">
          <TapAnimation type="laminar" />
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-1">Low Flow Rate</p>
            <p className="text-slate-300 text-sm leading-tight">Smooth, glass-like, orderly stream (Laminar)</p>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Imagine opening a tap slightly so that water flows out through a very small opening.
          At first, the water comes out as a <span className="text-blue-600 font-bold">smooth, clear, glass-like stream</span>.
        </p>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-8">Increasing the Flow</h2>
        <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden border-4 border-slate-800 shadow-xl">
          <TapAnimation type="turbulent" />
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-1">High Flow Rate</p>
            <p className="text-slate-300 text-sm leading-tight">Chaotic, splashing, noisy stream (Turbulent)</p>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed">
          As the flow rate increases, the smooth stream suddenly breaks into <span className="text-rose-600 font-bold">irregular, splashing, chaotic motion</span>.
          The water begins to vibrate, swirl, and mix with air.
        </p>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-8">The Transition</h2>
        <div className="p-6 bg-slate-50 border-l-4 border-blue-500 rounded-r-2xl italic mb-6">
          "Why does the same tap produce a smooth, stable stream at low opening but a chaotic, irregular stream at full opening?"
        </div>
        <p className="text-slate-600 leading-relaxed">
          In 1883, Osborne Reynolds investigated this question using a simple dye experiment in a pipe. 
          His work revealed that the transition depends on a dimensionless parameter called the <span className="font-bold text-blue-600">Reynolds Number</span>.
        </p>
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
            <HelpCircle size={18} /> The Big Question
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            What physical properties of the fluid and the pipe determine when this transition happens? 
            Let's find out in the virtual lab.
          </p>
        </div>
      </div>
    )
  ];

  return (
    <motion.div 
      key="s2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <CardStepper cards={cards} onComplete={onNext} onPrevSection={onPrev} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function TapAnimation({ type }: { type: 'laminar' | 'turbulent' }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center pt-10 bg-slate-950">
      {/* Tap Head */}
      <div className="relative z-20">
        <div className="w-16 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-lg shadow-lg" />
        <div className="w-12 h-4 bg-slate-700 mx-auto rounded-b-md" />
      </div>

      {/* Water Stream */}
      <div className="flex-1 w-full relative flex justify-center overflow-hidden">
        {type === 'laminar' ? (
          <motion.div 
            className="w-4 h-full bg-gradient-to-b from-blue-400/40 via-blue-200/60 to-blue-400/40 backdrop-blur-[2px] shadow-[0_0_20px_rgba(147,197,253,0.3)]"
            animate={{
              width: [14, 16, 14],
              opacity: [0.7, 0.9, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Glossy highlights */}
            <div className="absolute inset-y-0 left-1 w-0.5 bg-white/40" />
            <div className="absolute inset-y-0 right-1 w-0.5 bg-white/20" />
          </motion.div>
        ) : (
          <div className="relative w-12 h-full">
            {/* Chaotic core */}
            <motion.div 
              className="absolute inset-x-0 h-full bg-blue-300/30 blur-md"
              animate={{
                scaleX: [1, 1.2, 0.9, 1.1],
                opacity: [0.3, 0.5, 0.4]
              }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
            {/* Splashing particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-blue-100/80 rounded-full blur-[1px]"
                animate={{
                  y: [-20, 400],
                  x: [0, (i % 2 === 0 ? 30 : -30) * Math.random()],
                  scale: [1, 2.5],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 0.6 + Math.random() * 0.4,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "linear"
                }}
                style={{ left: '50%' }}
              />
            ))}
            {/* Turbulent swirls */}
            <motion.div 
              className="absolute inset-x-0 top-0 h-full flex flex-col items-center"
              animate={{ x: [-2, 2, -1, 1] }}
              transition={{ duration: 0.1, repeat: Infinity }}
            >
              <div className="w-8 h-full bg-gradient-to-b from-blue-400/40 to-transparent" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Splash at bottom */}
      <div className="h-12 w-full bg-slate-900/50 relative flex justify-center">
        {type === 'turbulent' && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-4 w-2 h-2 bg-blue-200/60 rounded-full"
            animate={{
              y: [0, -40 - Math.random() * 40],
              x: [(i - 4) * 10, (i - 4) * 30],
              opacity: [1, 0],
              scale: [1, 0.5]
            }}
            transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
          />
        ))}
      </div>
    </div>
  );
}

function Section3({ 
  velocity, setVelocity, 
  diameter, setDiameter, 
  viscosity, setViscosity,
  reynolds, regime,
  predictionMade, setPredictionMade,
  showPredictionBox, setShowPredictionBox,
  onNext, onPrev, slidePrefix
}: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Pipe
      const pipeHeight = diameter * 6000;
      const centerY = canvas.height / 2;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, centerY - pipeHeight/2, canvas.width, pipeHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, centerY - pipeHeight/2, canvas.width, pipeHeight);

      // Draw Dye Filament
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.moveTo(0, centerY);

      for (let x = 0; x < canvas.width; x += 5) {
        let offset = 0;
        if (reynolds > 2000) {
          const intensity = Math.min(pipeHeight * 0.4, (reynolds - 2000) / 100);
          const freq = 0.05;
          offset = Math.sin(x * freq - time * 2) * intensity * (x / canvas.width);
        }
        if (reynolds > 4000) {
          const turbulence = Math.min(pipeHeight * 0.1, (reynolds - 4000) / 500);
          offset += (Math.random() - 0.5) * turbulence * (x / canvas.width);
        }
        ctx.lineTo(x, centerY + offset);
      }
      ctx.stroke();

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [reynolds, diameter]);

  useEffect(() => {
    if (!predictionMade && velocity > 0.4) {
      setShowPredictionBox(true);
    }
  }, [velocity, predictionMade]);

  const handlePrediction = (correct: boolean) => {
    setPredictionMade(true);
    setShowPredictionBox(false);
    if (correct) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const cards = [
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-6">Exploration: Observe & Adjust</h2>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 mb-6">
          <div className="text-blue-600 shrink-0"><Play size={20} /></div>
          <p className="text-blue-900 font-medium text-sm">
            Adjust the velocity slider to see how it affects the flow of water in a 2cm diameter pipe.
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={300} 
            className="w-full h-auto bg-white rounded-lg border border-slate-200 shadow-inner"
          />
          
          <div className="mt-6 flex flex-col items-center">
            <div className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex justify-between">
                  Velocity (v) <span>{velocity.toFixed(2)} m/s</span>
                </label>
                <input 
                  type="range" min="0.01" max="1.5" step="0.01" 
                  value={velocity} onChange={(e) => setVelocity(parseFloat(e.target.value))}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fluid</p>
                  <p className="text-sm font-bold text-slate-700">Water</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pipe Diameter</p>
                  <p className="text-sm font-bold text-slate-700">2.0 cm</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showPredictionBox && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 mt-8"
            >
              <h3 className="text-lg font-bold mb-4">PREDICTION: If you continue to increase the velocity, what will happen to the dye filament?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePrediction(false)}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-left transition-colors"
                >
                  It will remain a straight, thin line.
                </button>
                <button 
                  onClick={() => handlePrediction(true)}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-left transition-colors"
                >
                  It will start to oscillate and break apart.
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {predictionMade && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4 mt-8"
          >
            <div className="text-emerald-600 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <p className="text-emerald-900 font-medium">Observation Note</p>
              <p className="text-emerald-700 text-sm leading-relaxed">
                As you increased the velocity, the dye filament began to oscillate (Transitional) and eventually dispersed completely (Turbulent). This happens because the inertial forces of the moving water overcome the viscous forces that keep the layers smooth.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    )
  ];

  return (
    <motion.div 
      key="s3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper 
          cards={cards} 
          onComplete={onNext} 
          onPrevSection={onPrev} 
          slidePrefix={slidePrefix} 
          nextDisabled={false}
        />
      </div>
    </motion.div>
  );
}

function Section4({ onNext, onPrev, log, setLog, slidePrefix }: any) {
  const q2Config = {
    id: 'q2-refined',
    mainQuestion: "What does the spreading of the dye indicate about the motion of fluid particles?",
    observationPrompt: "Describe what you observed in the simulation when the dye began to spread. What does this tell you about the fluid's motion?",
    options: [
      "A. Fluid particles are moving in smooth layers",
      "B. Fluid motion has become chaotic and mixed",
      "C. Fluid density suddenly increased",
      "D. Fluid has stopped moving"
    ],
    correctIndex: 1,
    rationalePrompt: "Briefly explain why you chose this answer based on what you observed in the simulation.",
    correctReinforcement: {
      title: "Correct!",
      text: "When the dye spreads through the pipe, it shows fluid particles are moving in irregular paths and mixing with each other.",
      subText: "This behaviour indicates turbulent motion.",
      extension: "You can verify this by increasing velocity further in the simulation and observing how rapidly the dye spreads."
    },
    paths: {
      0: { // Option A
        attempts: [
          {
            q: "In smooth layered flow, the dye stays as a thin straight line. In the simulation, did the dye remain a straight line when you increased velocity?",
            options: ["Yes", "No"],
            correct: 1,
            responses: {
              correct: "Good observation. If the dye does not remain straight, the flow is no longer smooth layers.",
              incorrect: "Try this: move the velocity slider slightly higher and watch the dye again. Does it still stay straight?"
            }
          },
          {
            q: "Observe the simulation again. Increase the velocity and watch the dye carefully. Does the dye stay as a thin line or does it spread across the pipe?",
            options: ["Thin straight line", "Spreads across pipe"],
            correct: 1,
            responses: {
              correct: "Exactly. When dye spreads, fluid layers are mixing.",
              incorrect: "Look again. The dye definitely doesn't stay in a thin line at high speeds."
            }
          },
          {
            q: "Look carefully at the dye behaviour after increasing velocity. Spreading dye usually means layers are mixing rather than remaining smooth.",
            type: 'hint'
          }
        ]
      },
      2: { // Option C
        attempts: [
          {
            q: "Did the simulation change the fluid density, or did it change the velocity?",
            options: ["Velocity", "Density"],
            correct: 0,
            responses: {
              correct: "Right. The simulation changes velocity, not density.",
              incorrect: "Check the simulation controls again. Move the velocity slider and observe the dye behaviour."
            }
          },
          {
            q: "Increase the velocity slightly. What happens to the dye pattern?",
            options: ["Remains straight", "Begins to spread"],
            correct: 1,
            responses: {
              correct: "Correct. The pattern changes due to velocity.",
              incorrect: "Observe again. Higher velocity causes spreading."
            }
          },
          {
            q: "Spreading dye is caused by changes in fluid motion, not density. Observe the dye again while adjusting the velocity.",
            type: 'hint'
          }
        ]
      },
      3: { // Option D
        attempts: [
          {
            q: "If the fluid stopped moving, what would happen to the dye?",
            options: ["Stay nearly still", "Spread across pipe"],
            correct: 0,
            responses: {
              correct: "Exactly. If flow stopped, dye would not spread.",
              incorrect: "Observe the simulation again. Move the velocity slider and see whether the dye spreads because the fluid is moving faster."
            }
          },
          {
            q: "Increase the velocity and observe carefully. Is the dye spreading because the fluid stopped or because it is moving faster?",
            options: ["Stopped", "Moving faster"],
            correct: 1,
            responses: {
              correct: "Correct. It's moving faster.",
              incorrect: "It's definitely moving faster when it spreads."
            }
          },
          {
            q: "Spreading dye indicates strong fluid motion and mixing, not stopped flow. Adjust the velocity slider again and observe.",
            type: 'hint'
          }
        ]
      }
    }
  };

  const cards = [
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-6">Exploration Analysis</h2>
        <p className="text-slate-600 leading-relaxed">
          Now that you've explored the simulation, let's analyze what you observed. 
          Think about the relationship between the fluid's velocity and the behavior of the dye filament.
        </p>
        <div className="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl">
          <p className="text-amber-800 font-medium">
            "Observation is the first step towards understanding."
          </p>
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Critical Thinking</h2>
        <SocraticRefined 
          config={q2Config}
          onComplete={onNext}
          log={log}
          setLog={setLog}
        />
      </div>
    )
  ];

  return (
    <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} onPrevSection={onPrev} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function Section5({ onNext, onPrev, log, setLog, slidePrefix }: any) {
  const q3Config = {
    id: 'q3-refined',
    mainQuestion: "Which parameter determines whether the flow will be laminar or turbulent?",
    observationPrompt: "Based on the Reynolds formula (Re = ρvD/μ), which of these parameters do you think is the primary 'control' for the flow regime?",
    options: [
      "A. Reynolds number",
      "B. Colour of dye",
      "C. Length of pipe",
      "D. Temperature of room air"
    ],
    correctIndex: 0,
    rationalePrompt: "Explain why you think this parameter determines the type of flow.",
    correctReinforcement: {
      title: "Correct!",
      text: "The Reynolds number combines velocity, viscosity, pipe diameter, and fluid density into a single parameter.",
      subText: "It predicts whether the flow will remain laminar or become turbulent.",
      extension: "Try increasing the velocity slider again and notice how the Reynolds number increases along with turbulence."
    },
    paths: {
      1: { // Option B
        attempts: [
          {
            q: "Does changing the dye colour in the simulation affect how the fluid moves?",
            options: ["Yes", "No"],
            correct: 1,
            responses: {
              correct: "Good observation. Colour is just a tracer.",
              incorrect: "Think again. Does the fluid care if the dye is red or blue?"
            }
          }
        ]
      },
      2: { // Option C
        attempts: [
          {
            q: "If you have a very long pipe but the fluid is moving very slowly, will it necessarily become turbulent?",
            options: ["Yes", "No"],
            correct: 1,
            responses: {
              correct: "Correct. Length alone doesn't trigger turbulence.",
              incorrect: "Actually, even in a long pipe, slow flow remains laminar."
            }
          }
        ]
      },
      3: { // Option D
        attempts: [
          {
            q: "Does the room air temperature directly enter the Reynolds equation we just saw?",
            options: ["Yes", "No"],
            correct: 1,
            responses: {
              correct: "Right. It's not a direct variable in the equation.",
              incorrect: "Look at the formula Re = (ρvD)/μ. Is 'Room Temp' there?"
            }
          }
        ]
      }
    }
  };

  const cards = [
    (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold mb-8">Concept & Theory</h2>
        <p className="text-slate-600 leading-relaxed">
          You observed that increasing velocity or diameter led to turbulence, while increasing viscosity kept the flow laminar. This relationship was formalized by Osborne Reynolds in 1883.
        </p>
        <div className="bg-slate-900 text-white p-8 rounded-2xl text-center space-y-4">
          <p className="text-slate-400 text-sm uppercase font-bold tracking-widest">The Reynolds Equation</p>
          <div className="text-4xl font-serif italic">
            Re = <span className="border-b-2 border-white/20 pb-1">ρ · v · D</span> / μ
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs text-slate-400">
            <div><p className="text-white font-bold">ρ</p><p>Density (kg/m³)</p></div>
            <div><p className="text-white font-bold">v</p><p>Velocity (m/s)</p></div>
            <div><p className="text-white font-bold">D</p><p>Diameter (m)</p></div>
            <div><p className="text-white font-bold">μ</p><p>Viscosity (Pa·s)</p></div>
          </div>
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Flow Regimes</h2>
        <div className="grid gap-4">
          <RegimeCard 
            title="Laminar (Re < 2000)" 
            desc="Fluid particles move in parallel layers. No mixing. You saw this as a straight dye line." 
            color="emerald"
          />
          <RegimeCard 
            title="Transitional (2000 < Re < 4000)" 
            desc="The dye filament begins to oscillate. Flow is unstable." 
            color="amber"
          />
          <RegimeCard 
            title="Turbulent (Re > 4000)" 
            desc="Rapid mixing, eddies, and chaotic motion. The dye disperses completely." 
            color="rose"
          />
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Knowledge Check</h2>
        <SocraticRefined 
          config={q3Config}
          onComplete={onNext}
          log={log}
          setLog={setLog}
        />
      </div>
    )
  ];

  return (
    <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <CardStepper cards={cards} onComplete={onNext} onPrevSection={onPrev} slidePrefix={slidePrefix} />
      </div>
    </motion.div>
  );
}

function RegimeCard({ title, desc, color }: { title: string; desc: string; color: string }) {
  const colors: any = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
    rose: "bg-rose-50 border-rose-100 text-rose-900"
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-80">{desc}</p>
    </div>
  );
}

function Section6({ onNext, onPrev, slidePrefix }: any) {
  const [activeComp, setActiveComp] = useState<string | null>(null);
  const [viewedComps, setViewedComps] = useState<Set<string>>(new Set());

  const components = [
    { id: 'tank', name: 'Constant Head Tank', role: 'Maintains steady pressure', unit: 'm (Head)', type: 'Input' },
    { id: 'dye', name: 'Dye Reservoir', role: 'Injects visual tracer', unit: 'ml/s', type: 'Input' },
    { id: 'pipe', name: 'Glass Test Pipe', role: 'Observation section', unit: 'm (Diameter)', type: 'Fixed' },
    { id: 'valve', name: 'Control Valve', role: 'Regulates flow velocity', unit: 'm/s', type: 'Input' },
  ];

  const handleCompClick = (id: string) => {
    setActiveComp(id);
    const newViewed = new Set(viewedComps);
    newViewed.add(id);
    setViewedComps(newViewed);
  };

  const isComplete = viewedComps.size === components.length;

  return (
    <motion.div key="s6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Apparatus Components</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-8">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              <rect x="50" y="50" width="100" height="150" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
              <rect x="150" y="170" width="200" height="20" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              <circle cx="100" cy="70" r="15" fill="#ef4444" />
              <line x1="100" y1="85" x2="150" y2="180" stroke="#ef4444" strokeWidth="2" />
              <rect x="320" y="165" width="10" height="30" fill="#1e293b" />
              
              <Hotspot x={100} y={120} active={activeComp === 'tank'} onClick={() => handleCompClick('tank')} />
              <Hotspot x={100} y={70} active={activeComp === 'dye'} onClick={() => handleCompClick('dye')} />
              <Hotspot x={250} y={180} active={activeComp === 'pipe'} onClick={() => handleCompClick('pipe')} />
              <Hotspot x={325} y={180} active={activeComp === 'valve'} onClick={() => handleCompClick('valve')} />
            </svg>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Reference Panel</h3>
            <div className="grid gap-3">
              {components.map(c => (
                <button 
                  key={c.id}
                  onClick={() => handleCompClick(c.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    activeComp === c.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{c.name}</span>
                    <div className="flex items-center gap-2">
                       {viewedComps.has(c.id) && <CheckCircle2 size={12} className={activeComp === c.id ? 'text-white' : 'text-emerald-500'} />}
                       <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                         activeComp === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                       }`}>{c.type}</span>
                    </div>
                  </div>
                  {activeComp === c.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <p className="text-sm opacity-90 mb-2">{c.role}</p>
                      <p className="text-xs font-mono">Unit: {c.unit}</p>
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button 
            onClick={onNext} 
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            View Procedure <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Hotspot({ x, y, active, onClick }: { x: number; y: number; active: boolean; onClick: () => void }) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      <motion.circle 
        cx={x} cy={y} r={8} 
        fill={active ? "#2563eb" : "#f59e0b"}
        animate={{ scale: active ? [1, 1.2, 1] : [1, 1.5, 1], opacity: active ? 1 : [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </g>
  );
}

function Section7({ onNext, onPrev, slidePrefix }: any) {
  const steps = [
    { title: "Fill the Tank", desc: "Ensure the constant head tank is full of water and allowed to settle to eliminate initial turbulence." },
    { title: "Open Dye Valve", desc: "Slightly open the dye injector valve to release a thin filament of dye into the center of the glass pipe." },
    { title: "Adjust Flow", desc: "Gradually open the flow control valve at the pipe outlet to increase water velocity." },
    { title: "Observe Regime", desc: "Watch the dye filament. Record whether it is straight (laminar), wavy (transitional), or dispersed (turbulent)." },
    { title: "Measure Flow Rate", desc: "For each state, measure the volume of water collected in a measuring cylinder over a fixed time to calculate velocity." },
  ];

  return (
    <motion.div key="s7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Experimental Procedure</h2>
        
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary flex items-center gap-2">
            Go to Experiment <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const FLUIDS = {
  Water: { rho: 1000, mu: 0.001 },
  Oil: { rho: 900, mu: 0.05 },
  Air: { rho: 1.225, mu: 0.000018 }
};

function Section8({ trials, setTrials, currentData, onNext, onPrev, slidePrefix }: any) {
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [localFlowRate, setLocalFlowRate] = useState(0.00001); // Q in m³/s
  const selectedFluid = 'Water';
  const zoomPipeRef = useRef<any>(null);
  
  const D = 0.02; // Fixed diameter for experiment
  const AREA = (Math.PI * Math.pow(D, 2)) / 4;
  
  const { rho, mu } = FLUIDS[selectedFluid];
  const velocity = isPumpOn ? localFlowRate / AREA : 0;
  const re = (rho * velocity * D) / mu;
  
  const regime: FlowRegime = re < 2000 ? 'Laminar' : (re < 4000 ? 'Transitional' : 'Turbulent');

  const addTrial = () => {
    if (!isPumpOn) {
      return;
    }
    if (trials.length >= 5) return;
    
    const newTrial: TrialData = {
      id: trials.length + 1,
      fluid: selectedFluid,
      flowRate: localFlowRate,
      vFormula: "v = Q / A",
      velocity: velocity,
      reFormula: "Re = ρvD / μ",
      reynolds: Math.round(re),
      regime: regime,
      studentRe: '',
      studentObservation: ''
    };
    setTrials([...trials, newTrial]);
    
    if (trials.length + 1 === 5) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    }
  };

  const updateStudentInput = (id: number, field: 'studentRe' | 'studentObservation', value: string) => {
    setTrials(trials.map((t: any) => t.id === id ? { ...t, [field]: value } : t));
  };

  const hasAllRegimes = useMemo(() => {
    const regimes = new Set(trials.map((t: any) => t.regime));
    return regimes.has('Laminar') && regimes.has('Transitional') && regimes.has('Turbulent');
  }, [trials]);

  return (
    <motion.div key="s8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Interactive Experiment</h2>
            <div className="flex items-center gap-4">
              <p className="text-slate-500 text-sm">Slide {slidePrefix}.1: Apparatus Simulation</p>
              <div className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Pipe Diameter (D) = 2 cm (0.02 m)</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-blue-900 text-sm leading-relaxed">
            <strong>Instruction:</strong> Turn on the pump and adjust the flow rate using the valve. Take at least 6 readings at different speeds. Record the flow rate and then calculate the Reynolds Number and record your visual observation in the table.
          </p>
        </div>

        {/* Apparatus Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 relative overflow-hidden border-4 border-slate-800 shadow-2xl">
            <div className="absolute top-4 left-4 flex gap-4 z-10">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Flow Rate (Q)</p>
                <p className="text-emerald-400 font-mono text-lg">{isPumpOn ? localFlowRate.toFixed(6) : "0.000000"} <span className="text-[10px]">m³/s</span></p>
              </div>
              <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Fluid</p>
                <p className="text-blue-400 font-bold text-lg">{selectedFluid}</p>
              </div>
            </div>

            <div className="h-64 flex items-center justify-center relative">
              <ApparatusSVG isPumpOn={isPumpOn} flowRate={localFlowRate} />
            </div>

            <div className="mt-6 flex items-center gap-6">
              <button 
                onClick={() => setIsPumpOn(!isPumpOn)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
                  isPumpOn ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'bg-emerald-600 text-white'
                }`}
              >
                <Play size={18} className={isPumpOn ? 'hidden' : 'block'} />
                <RotateCcw size={18} className={isPumpOn ? 'block' : 'hidden'} />
                {isPumpOn ? 'Stop Pump' : 'Start Pump'}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Flow Control Valve</span>
                  <span>{Math.round((localFlowRate / 0.0008) * 100)}% Open</span>
                </div>
                <input 
                  type="range" min="0.000005" max="0.0008" step="0.000001" 
                  value={localFlowRate} onChange={(e) => setLocalFlowRate(parseFloat(e.target.value))}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Zoom View */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={14} /> Zoomed Pipe View
            </h3>
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden flex items-center justify-center">
              <ZoomPipeView 
                ref={zoomPipeRef}
                re={re} 
                isFlowing={isPumpOn} 
                flowRate={localFlowRate} 
                fluid={selectedFluid}
                trialNumber={trials.length + 1}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Observation Table</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => zoomPipeRef.current?.takeScreenshot()}
              disabled={!isPumpOn}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Camera size={16} /> Take Snapshot
            </button>
            <button 
              onClick={addTrial} 
              disabled={trials.length >= 5 || !isPumpOn}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Database size={16} /> Record Reading
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-8 px-8">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Trial</th>
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Fluid</th>
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Flow Rate (m³/s)</th>
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Velocity (m/s)</th>
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Reynolds No. (Student)</th>
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Calculated Re</th>
                <th className="p-4 text-left text-[10px] font-bold text-slate-500 uppercase">Observation</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((t: any) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-400">{t.id}</td>
                  <td className="p-4 text-sm font-medium text-slate-600">{t.fluid}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600">{t.flowRate.toFixed(6)}</td>
                  <td className="p-4 font-mono font-bold text-blue-600">{t.velocity.toFixed(3)}</td>
                  <td className="p-4">
                    <input 
                      type="text"
                      placeholder="Enter Re"
                      value={t.studentRe}
                      onChange={(e) => updateStudentInput(t.id, 'studentRe', e.target.value)}
                      className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-500">{t.reynolds}</td>
                  <td className="p-4">
                    <select
                      value={t.studentObservation}
                      onChange={(e) => updateStudentInput(t.id, 'studentObservation', e.target.value)}
                      className="w-32 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Observation</option>
                      <option value="Laminar">Laminar</option>
                      <option value="Transitional">Transitional</option>
                      <option value="Turbulent">Turbulent</option>
                    </select>
                  </td>
                </tr>
              ))}
              {trials.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic text-sm">
                    No readings recorded. Start the pump and click 'Record Reading'.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <button 
            onClick={onNext} 
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Continue to Analysis <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Section9Numerical({ onNext, onPrev, slidePrefix }: any) {
  const [inputs, setInputs] = useState({
    Water: '',
    Oil: '',
    Honey: '',
    Air: ''
  });

  const D = 0.02; // 2cm
  const v = 0.5; // Fixed velocity for comparison

  const fluids = [
    { name: 'Water', rho: 1000, mu: 0.001 },
    { name: 'Oil', rho: 900, mu: 0.05 },
    { name: 'Honey', rho: 1400, mu: 10 },
    { name: 'Air', rho: 1.225, mu: 0.000018 }
  ];

  const results = fluids.map(f => ({
    ...f,
    calculatedRe: Math.round((f.rho * v * D) / f.mu)
  }));

  const isComplete = results.every(f => {
    const val = parseFloat(inputs[f.name as keyof typeof inputs]);
    return !isNaN(val) && Math.abs(val - f.calculatedRe) < 2;
  });

  return (
    <motion.div key="s9n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-4">Numerical Challenge</h2>
        <p className="text-slate-600 mb-8">
          Calculate the Reynolds Number for different fluids flowing through the <b>same pipe (D = 2 cm)</b> at the <b>same velocity (v = 0.5 m/s)</b>. 
          Compare how viscosity and density change the flow regime.
        </p>

        <div className="grid gap-6 mb-8">
          {results.map(f => (
            <div key={f.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {f.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{f.name}</h3>
                  <p className="text-xs text-slate-500">ρ = {f.rho} kg/m³, μ = {f.mu} Pa·s</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Formula</p>
                  <p className="text-xs font-mono text-slate-600">({f.rho} × {v} × {D}) / {f.mu}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Your Re</label>
                  <input 
                    type="number"
                    value={inputs[f.name as keyof typeof inputs]}
                    onChange={(e) => setInputs({...inputs, [f.name]: e.target.value})}
                    placeholder="Calculate Re"
                    className="w-32 p-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {inputs[f.name as keyof typeof inputs] !== '' && (
                  <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                    Math.abs(parseFloat(inputs[f.name as keyof typeof inputs]) - f.calculatedRe) < 2 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
                  }`}>
                    {Math.abs(parseFloat(inputs[f.name as keyof typeof inputs]) - f.calculatedRe) < 2 ? 'Correct' : `Check: ${f.calculatedRe}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-8">
          <h3 className="font-bold text-blue-900 mb-2">Observation</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            Notice how <b>Honey</b> has a very low Reynolds number despite its high density, because its viscosity is extremely high. 
            Conversely, <b>Air</b> can reach high Reynolds numbers even with low density because its viscosity is tiny.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button 
            onClick={onNext} 
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Continue to Theory <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Section10ForceRatio({ onNext, onPrev, slidePrefix }: any) {
  const [hasRead, setHasRead] = useState(false);

  return (
    <motion.div key="s10f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">The Ratio of Forces</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <p className="text-lg text-slate-600 leading-relaxed">
              The Reynolds Number isn't just a random calculation. It represents the <b>competition</b> between two physical forces acting on every fluid particle:
            </p>
            
            <div className="space-y-4">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Zap size={18} /> 1. Inertial Forces (Numerator)
                </h3>
                <p className="text-blue-800 text-sm">
                  The force associated with the fluid's <b>momentum</b>. It wants to keep the fluid moving in its current direction. High velocity and density increase this force.
                </p>
              </div>

              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Shield size={18} /> 2. Viscous Forces (Denominator)
                </h3>
                <p className="text-amber-800 text-sm">
                  The "internal friction" or <b>stickiness</b> of the fluid. It wants to keep the fluid orderly and resist any chaotic changes. High viscosity increases this force.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setHasRead(!hasRead)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${hasRead ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}
                >
                  {hasRead && <CheckCircle2 size={16} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-700">I have read and understood the ratio of forces.</span>
              </label>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-8 border-4 border-slate-800 shadow-2xl">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Conceptual Balance</div>
            
            <div className="flex items-center gap-8 w-full max-w-md">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                  <Zap size={32} />
                </div>
                <span className="text-white text-xs font-bold">Inertia</span>
              </div>
              
              <div className="h-1 flex-1 bg-slate-700 relative">
                <motion.div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl"
                  animate={{ x: [-20, 20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/40">
                  <Shield size={32} />
                </div>
                <span className="text-white text-xs font-bold">Viscosity</span>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 w-full">
              <p className="text-slate-300 text-sm italic">
                "At <b>High Re</b>, Inertia wins. The fluid has too much momentum for viscosity to keep it in line, leading to chaotic swirls and eddies (Turbulence)."
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button 
            onClick={onNext} 
            className="btn-primary flex items-center gap-2"
          >
            Test Your Knowledge <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ApparatusSVG({ isPumpOn, flowRate }: any) {
  return (
    <svg viewBox="0 0 500 250" className="w-full h-full">
      {/* Constant Head Tank */}
      <rect x="20" y="20" width="100" height="120" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
      <rect x="25" y="40" width="90" height="95" fill="#3b82f6" opacity="0.3" />
      <text x="30" y="15" fill="#64748b" fontSize="10" fontWeight="bold">CONSTANT HEAD TANK</text>
      
      {/* Bell Mouth Inlet */}
      <path d="M 120 90 Q 140 90 140 100 Q 140 110 120 110" fill="none" stroke="#94a3b8" strokeWidth="2" />
      
      {/* Glass Tube */}
      <rect x="140" y="95" width="280" height="10" fill="rgba(255,255,255,0.1)" stroke="#94a3b8" strokeWidth="1" />
      <text x="220" y="85" fill="#64748b" fontSize="10" fontWeight="bold">GLASS TUBE</text>

      {/* Dye Container */}
      <rect x="130" y="30" width="30" height="40" fill="#ef4444" opacity="0.8" />
      <path d="M 145 70 L 145 95" stroke="#ef4444" strokeWidth="2" />
      <text x="125" y="25" fill="#ef4444" fontSize="9" fontWeight="bold">DYE TANK</text>

      {/* Outlet Valve */}
      <circle cx="430" cy="100" r="15" fill="#334155" stroke="#475569" strokeWidth="2" />
      <rect x="425" y="90" width="10" height="20" fill="#94a3b8" />
      <text x="415" y="130" fill="#64748b" fontSize="10" fontWeight="bold">VALVE</text>

      {/* Collection Tank */}
      <rect x="450" y="150" width="40" height="60" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
      <text x="440" y="225" fill="#64748b" fontSize="9" fontWeight="bold">COLLECTION</text>

      {/* Flow Animation */}
      {isPumpOn && (
        <motion.rect 
          x="140" y="96" width="10" height="8" fill="#3b82f6" opacity="0.2"
          animate={{ x: [140, 420] }}
          transition={{ duration: 2 / (flowRate * 10000), repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {isPumpOn && (
        <motion.path 
          d="M 145 100 L 420 100" 
          stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 1 / (flowRate * 10000), repeat: Infinity, ease: "linear" }}
        />
      )}
    </svg>
  );
}

const ZoomPipeView = React.forwardRef(({ re, isFlowing, flowRate, fluid, trialNumber }: any, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to add text (larger for better quality)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width * 2;
    tempCanvas.height = canvas.height * 2 + 120;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Background
    tempCtx.fillStyle = '#0f172a'; // slate-900
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Add text at the top
    tempCtx.fillStyle = '#38bdf8'; // blue-400
    tempCtx.font = 'bold 24px sans-serif';
    tempCtx.fillText(`REYNOLDS EXPERIMENT - TRIAL DATA`, 20, 40);
    
    tempCtx.fillStyle = 'white';
    tempCtx.font = '18px sans-serif';
    tempCtx.fillText(`Trial Number: ${trialNumber}`, 20, 80);
    tempCtx.fillText(`Fluid Used: ${fluid}`, 20, 110);
    tempCtx.fillText(`Discharge (Q): ${flowRate.toFixed(6)} m³/s`, 20, 140);

    // Draw original canvas content (scaled)
    tempCtx.drawImage(canvas, 0, 160, canvas.width * 2, canvas.height * 2);

    // Download
    const link = document.createElement('a');
    link.download = `reynolds-trial-${trialNumber}-${fluid}-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  React.useImperativeHandle(ref, () => ({
    takeScreenshot
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animationFrame: number;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Pipe (Matching Section 3 style)
      const pipeHeight = 40; // Fixed diameter D=0.02 * 2000
      const centerY = canvas.height / 2;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, centerY - pipeHeight/2, canvas.width, pipeHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, centerY - pipeHeight/2, canvas.width, pipeHeight);

      if (isFlowing) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 3;
        ctx.moveTo(0, centerY);

        for (let x = 0; x < canvas.width; x += 5) {
          let offset = 0;
          if (re > 2000) {
            const intensity = Math.min(15, (re - 2000) / 150); // Adjusted for zoom view
            const freq = 0.05;
            offset = Math.sin(x * freq - time * 2) * intensity * (x / canvas.width);
          }
          if (re > 4000) {
            offset += (Math.random() - 0.5) * (re - 4000) / 100 * (x / canvas.width);
          }
          ctx.lineTo(x, centerY + offset);
        }
        ctx.stroke();
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [re, isFlowing]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} width={300} height={150} className="w-full h-full bg-slate-900" />
    </div>
  );
});

function Section9({ onComplete, onPrev, log, setLog, slidePrefix }: any) {
  const [qIdx, setQIdx] = useState(0);

  const quizQuestions: SocraticQuestion[] = [
    {
      id: 'q1',
      q: "If a fluid has a very high viscosity (like honey), how does it affect the Reynolds Number?",
      observationPrompt: "Look at the Reynolds formula: Re = ρvD / μ. If μ (viscosity) increases significantly, what happens to the overall value of Re?",
      options: ["Increases Re", "Decreases Re", "No effect"],
      rationales: ["Viscosity is in numerator", "Viscosity is in denominator", "Re only depends on speed"],
      correct: 1,
      reinforcement: "Exactly! Viscosity acts as a stabilizing force. High viscosity (like in honey or heavy oil) resists the chaotic inertial forces, keeping the flow laminar even at higher speeds. This is why thick fluids don't splash as easily as water.",
      reinforcing: [
        { 
          id: 'q1-r1', 
          q: "So, high viscosity makes flow more likely to be...", 
          observationPrompt: "If Re decreases due to high viscosity, which regime is it moving towards?",
          options: ["Laminar", "Turbulent"], 
          correct: 0, 
          rationales: ["Viscous forces dominate", "Inertia is high"],
          reinforcement: "Correct. Viscosity 'dampens' any small disturbances, preventing them from growing into full-blown turbulence."
        }
      ],
      corrective: [
        { 
          id: 'q1-c1', 
          q: "Look at the formula: Re = ρvD / μ. If μ (denominator) gets bigger, what happens to the result?", 
          observationPrompt: "In a fraction, if the bottom number (denominator) increases, does the total value increase or decrease?",
          options: ["Result gets smaller", "Result gets bigger"], 
          correct: 0, 
          rationales: ["Math principle", "Inverse relationship"],
          reinforcement: "Yes, it's an inverse relationship. Larger denominator means smaller result."
        }
      ]
    },
    {
      id: 'q2',
      q: "A flow has Re = 2500. What regime is it in?",
      observationPrompt: "Recall the critical values for Reynolds Number in pipe flow. Where does 2500 fall?",
      options: ["Laminar", "Transitional", "Turbulent"],
      rationales: ["Below 2000", "Between 2000 and 4000", "Above 4000"],
      correct: 1,
      reinforcement: "Correct! Between 2000 and 4000, the flow is in a state of flux, neither fully smooth nor fully chaotic. It's like a car engine just starting to sputter before it stalls.",
      reinforcing: [
        { 
          id: 'q2-r1', 
          q: "What would you expect to see in the dye filament at Re = 2500?", 
          observationPrompt: "Describe the visual appearance of the dye when it's neither a straight line nor completely mixed.",
          options: ["Straight line", "Wavy filament"], 
          correct: 1, 
          rationales: ["Stable flow", "Unstable oscillations"],
          reinforcement: "Exactly. You'll see 'shivering' or waves in the dye, indicating the onset of instability."
        }
      ],
      corrective: [
        { 
          id: 'q2-c1', 
          q: "Recall the limits: Laminar < 2000, Turbulent > 4000. Where does 2500 sit?", 
          observationPrompt: "Compare 2500 to the boundaries 2000 and 4000.",
          options: ["In the middle", "At the top"], 
          correct: 0, 
          rationales: ["Numerical range", "Extreme range"],
          reinforcement: "Yes, it's right in the transition zone."
        }
      ]
    }
  ];

  return (
    <motion.div key="s9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Knowledge Check</h2>
        <SocraticSystem 
          questions={quizQuestions} 
          onComplete={onComplete} 
          log={log} 
          setLog={setLog} 
        />
        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
        </div>
      </div>
    </motion.div>
  );
}

function Section10({ trials, onNext, onPrev, slidePrefix }: any) {
  return (
    <motion.div key="s10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Calculation & Data Analysis</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} /> Sample Calculation (Trial 1)</h3>
              {trials.length > 0 ? (
                <div className="space-y-2 font-mono text-sm">
                  <p>Re = (ρ · v · D) / μ</p>
                  <p>Re = (1000 · {trials[0].velocity.toFixed(2)} · 0.02) / 0.001</p>
                  <p className="text-blue-600 font-bold">Re = {trials[0].reynolds}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No data available for calculation.</p>
              )}
            </div>

            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Trend Identification</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                As the velocity increases, the Reynolds Number increases linearly. This confirms that inertial forces grow relative to viscous forces as the fluid speeds up.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-inner h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="velocity" name="Velocity" unit="m/s" label={{ value: 'Velocity (m/s)', position: 'insideBottom', offset: -10 }} />
                <YAxis type="number" dataKey="reynolds" name="Reynolds" label={{ value: 'Re', angle: -90, position: 'insideLeft' }} />
                <ZAxis type="number" range={[100, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Trials" data={trials} fill="#2563eb" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary flex items-center gap-2">
            Need Help? <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Section11({ onNext, onPrev, slidePrefix }: any) {
  return (
    <motion.div key="s11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8">Scaffolding Sheet</h2>
        
        <div className="space-y-4">
          <ScaffoldPanel title="Interpretation Prompts">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• If your Re was below 2000, did the dye look like a solid thread? (Laminar)</li>
              <li>• At what velocity did the thread start to "shiver"? (Critical Velocity)</li>
              <li>• Why does honey (high viscosity) stay laminar longer than water?</li>
            </ul>
          </ScaffoldPanel>
          <ScaffoldPanel title="Conceptual Hints">
            <p className="text-sm text-slate-600 leading-relaxed">
              Think of the Reynolds Number as a ratio of <strong>Inertial Forces</strong> to <strong>Viscous Forces</strong>. Inertial forces want to keep the fluid moving and chaotic. Viscous forces want to keep it orderly and smooth.
            </p>
          </ScaffoldPanel>
          <ScaffoldPanel title="Guided Discussion">
            <p className="text-sm text-slate-600 leading-relaxed">
              In your results, did the transition happen exactly at 2000? In real experiments, this value can vary slightly depending on pipe roughness and external vibrations.
            </p>
          </ScaffoldPanel>
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button onClick={onNext} className="btn-primary flex items-center gap-2">
            Final Challenge <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ScaffoldPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full p-4 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
      >
        <span className="font-bold text-slate-700">{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 bg-white"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section12({ onPrev, slidePrefix }: any) {
  return (
    <motion.div key="s12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border-2 border-blue-600">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-blue-100 rounded-3xl text-blue-600">
            <CheckCircle2 size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Final Challenge</h1>
            <p className="text-slate-500">The Arterial Mystery</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-blue-900 font-medium mb-4">Real-World Scenario</p>
            <p className="text-blue-800 text-sm leading-relaxed">
              In a healthy human, blood flow in the aorta is typically laminar. However, during heavy exercise, the heart pumps blood much faster.
            </p>
            <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200 font-mono text-xs space-y-1">
              <p>Aorta diameter = 2.5 cm</p>
              <p>Blood density = 1060 kg/m³</p>
              <p>Viscosity = 0.0035 Pa·s</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold">The Challenge</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Calculate the velocity at which blood flow becomes turbulent (Re = 4000). Why might the body want to avoid turbulent blood flow in the arteries?
            </p>
            <p className="text-xs text-slate-400 italic">
              Hint: Think about energy loss and the sound a doctor hears through a stethoscope (Bruits).
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button onClick={onPrev} className="btn-secondary">Back</button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Slide {slidePrefix}.1</span>
          <button 
            onClick={() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })}
            className="btn-primary"
          >
            Complete Lab
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SocraticRefined({ config, onComplete, log, setLog }: any) {
  const [phase, setPhase] = useState<'observation' | 'main' | 'rationale' | 'path' | 'correct_reinforcement'>('observation');
  const [observation, setObservation] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedRationale, setTypedRationale] = useState('');
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [pathPhase, setPathPhase] = useState<'question' | 'feedback'>('question');
  const [feedbackText, setFeedbackText] = useState('');

  const { mainQuestion, options, correctIndex, rationalePrompt, correctReinforcement, paths, observationPrompt } = config;

  const handleObservationSubmit = () => {
    if (observation.trim().length < 5) return;
    setPhase('main');
  };

  const handleOptionSelect = (idx: number) => {
    setSelectedOption(idx);
    setPhase('rationale');
  };

  const handleRationaleSubmit = () => {
    if (!typedRationale.trim()) return;
    
    if (selectedOption === correctIndex) { // Correct
      setPhase('correct_reinforcement');
      // Log correct answer
      const entry: SocraticLogEntry = {
        questionId: config.id,
        questionText: mainQuestion,
        answer: options[selectedOption],
        rationale: typedRationale,
        isCorrect: true
      };
      setLog([...log, entry]);
    } else {
      setPhase('path');
      setAttemptIndex(0);
      setPathPhase('question');
    }
  };

  const handlePathAnswer = (idx: number) => {
    const currentPath = paths[selectedOption!];
    const currentAttempt = currentPath.attempts[attemptIndex];
    
    if (idx === currentAttempt.correct) {
      setFeedbackText(currentAttempt.responses.correct);
    } else {
      setFeedbackText(currentAttempt.responses.incorrect);
    }
    setPathPhase('feedback');
  };

  const handlePathNext = () => {
    const currentPath = paths[selectedOption!];
    
    if (pathPhase === 'feedback') {
      // After feedback, move to next attempt or return to main
      if (attemptIndex + 1 < currentPath.attempts.length) {
        setAttemptIndex(attemptIndex + 1);
        const nextAttempt = currentPath.attempts[attemptIndex + 1];
        if (nextAttempt.type === 'hint') {
          setPathPhase('feedback'); // Hints are just text
          setFeedbackText(nextAttempt.q);
        } else {
          setPathPhase('question');
        }
      } else {
        // Return to main question
        setPhase('main');
        setSelectedOption(null);
        setTypedRationale('');
      }
    } else if (currentPath.attempts[attemptIndex].type === 'hint') {
      // If it was a hint, return to main
      setPhase('main');
      setSelectedOption(null);
      setTypedRationale('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
        {phase === 'observation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-lg font-bold mb-2">{mainQuestion}</h3>
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-600">
                {observationPrompt || "Record your initial observation or answer before seeing the choices:"}
              </label>
              <textarea 
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Type your observation here..."
              />
              <button 
                onClick={handleObservationSubmit}
                disabled={observation.trim().length < 5}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Submit Observation <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'main' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold mb-6">{mainQuestion}</h3>
            <div className="space-y-3">
              {options.map((opt: string, i: number) => (
                <button 
                  key={i} 
                  onClick={() => handleOptionSelect(i)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-600 hover:shadow-sm transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'rationale' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-900 font-medium">You selected: <span className="font-bold">{options[selectedOption!]}</span></p>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {rationalePrompt}
              </label>
              <textarea 
                value={typedRationale}
                onChange={(e) => setTypedRationale(e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Type your explanation here..."
              />
              <button 
                onClick={handleRationaleSubmit}
                disabled={!typedRationale.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Rationale <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'correct_reinforcement' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4 text-emerald-900">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
              <div className="space-y-4">
                <p className="font-bold text-xl">{correctReinforcement.title}</p>
                <p className="leading-relaxed">
                  {correctReinforcement.text}
                </p>
                <p className="font-medium">
                  {correctReinforcement.subText}
                </p>
                <div className="p-4 bg-white/50 rounded-xl border border-emerald-200 text-sm italic">
                  "{correctReinforcement.extension}"
                </div>
              </div>
            </div>
            <button onClick={onComplete} className="btn-primary w-full">
              Proceed to Next Section
            </button>
          </motion.div>
        )}

        {phase === 'path' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
              <p className="text-amber-900 text-sm">Let's explore your thinking further...</p>
            </div>

            {pathPhase === 'question' && (
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-800">{paths[selectedOption!].attempts[attemptIndex].q}</h4>
                <div className="space-y-3">
                  {paths[selectedOption!].attempts[attemptIndex].options.map((opt: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => handlePathAnswer(i)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-600 transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pathPhase === 'feedback' && (
              <div className="space-y-6">
                <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
                  <p className="text-slate-800 leading-relaxed">{feedbackText}</p>
                </div>
                <button onClick={handlePathNext} className="btn-primary w-full flex items-center justify-center gap-2">
                  {attemptIndex + 1 < (paths[selectedOption!]?.attempts?.length || 0) ? "Continue" : "Return to Main Question"}
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- SOCRATIC SYSTEM CORE ---

function SocraticSystem({ questions, onComplete, log, setLog }: any) {
  const [qIdx, setQIdx] = useState(0);
  const [currentQ, setCurrentQ] = useState(questions[0]);
  const [observation, setObservation] = useState("");
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [selectedRat, setSelectedRat] = useState<number | null>(null);
  const [phase, setPhase] = useState<'observation' | 'answer' | 'rationale' | 'feedback'>('observation');
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctiveIdx, setCorrectiveIdx] = useState(-1);

  useEffect(() => {
    if (currentQ.observationPrompt) {
      setPhase('observation');
    } else {
      setPhase('answer');
    }
  }, [currentQ]);

  const handleObservationSubmit = () => {
    if (observation.trim().length < 5) return;
    setPhase('answer');
  };

  const handleAnswer = (idx: number) => {
    setSelectedAns(idx);
    setPhase('rationale');
  };

  const handleRationale = (idx: number) => {
    setSelectedRat(idx);
    const correct = selectedAns === currentQ.correct;
    setIsCorrect(correct);
    
    // Log entry
    const entry: SocraticLogEntry = {
      questionId: currentQ.id,
      questionText: currentQ.q,
      answer: currentQ.options[selectedAns!],
      rationale: currentQ.rationales[idx],
      isCorrect: correct
    };
    setLog([...log, entry]);
    setPhase('feedback');
  };

  const handleNext = () => {
    if (isCorrect) {
      // Right path
      if (currentQ.reinforcing && currentQ.reinforcing.length > 0) {
        setCurrentQ(currentQ.reinforcing[0]);
        resetState();
      } else {
        // Move to next main question or finish
        if (qIdx + 1 < questions.length) {
          setQIdx(qIdx + 1);
          setCurrentQ(questions[qIdx + 1]);
          resetState();
        } else {
          onComplete();
        }
      }
    } else {
      // Wrong path - Scaffolding
      if (currentQ.corrective && correctiveIdx + 1 < currentQ.corrective.length) {
        const nextCorrectiveIdx = correctiveIdx + 1;
        setCorrectiveIdx(nextCorrectiveIdx);
        setCurrentQ(currentQ.corrective[nextCorrectiveIdx]);
        resetState();
      } else {
        // No more corrective questions, or already finished corrective path
        // Return to the main question to try again
        setCurrentQ(questions[qIdx]);
        setCorrectiveIdx(-1);
        resetState();
      }
    }
  };

  const resetState = () => {
    setSelectedAns(null);
    setSelectedRat(null);
    setObservation("");
    // Phase is set by useEffect based on currentQ
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-bold mb-6">{currentQ.q}</h3>
        
        <div className="space-y-3">
          {phase === 'observation' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-sm font-medium text-slate-600">{currentQ.observationPrompt || "Record your observation or initial thoughts before seeing the options:"}</p>
              <textarea 
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px] transition-all"
              />
              <button 
                onClick={handleObservationSubmit}
                disabled={observation.trim().length < 5}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                Submit Observation
              </button>
            </motion.div>
          )}

          {phase === 'answer' && currentQ.options.map((opt: string, i: number) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(i)}
              className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-600 hover:shadow-sm transition-all"
            >
              {opt}
            </button>
          ))}

          {phase === 'rationale' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Why did you choose this answer?</p>
              {currentQ.rationales.map((rat: string, i: number) => (
                <button 
                  key={i} 
                  onClick={() => handleRationale(i)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-600 hover:shadow-sm transition-all"
                >
                  {rat}
                </button>
              ))}
            </motion.div>
          )}

          {phase === 'feedback' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className={`p-6 rounded-2xl border flex gap-4 ${
                isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-900'
              }`}>
                <div className={isCorrect ? 'text-emerald-600' : 'text-amber-600'}>
                  {isCorrect ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <p className="font-bold">{isCorrect ? 'Correct!' : 'Think again...'}</p>
                  <p className="text-sm opacity-80 leading-relaxed">
                    {isCorrect 
                      ? (currentQ.reinforcement || "Your reasoning is sound. Let's explore this concept further.")
                      : "Not quite. Let's look at a simpler aspect of this problem to help you find the right path."}
                  </p>
                </div>
              </div>

              <button onClick={handleNext} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                {isCorrect ? 'Continue' : 'Next Question'} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- UTILS ---

function btnClass(type: 'primary' | 'secondary' | 'outline') {
  const base = "px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50";
  if (type === 'primary') return `${base} bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700`;
  if (type === 'secondary') return `${base} bg-white text-slate-600 border border-slate-200 hover:bg-slate-50`;
  if (type === 'outline') return `${base} bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50`;
}

// Global styles for buttons (since I can't easily use tailwind @layer here)
const style = document.createElement('style');
style.innerHTML = `
  .btn-primary { 
    padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s;
    background: #2563eb; color: white; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
  }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  
  .btn-secondary { 
    padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s;
    background: white; color: #475569; border: 1px solid #e2e8f0;
  }
  .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
  
  .btn-outline { 
    padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s;
    background: transparent; color: #2563eb; border: 2px solid #2563eb;
  }
  .btn-outline:hover { background: #eff6ff; }
`;
document.head.appendChild(style);
