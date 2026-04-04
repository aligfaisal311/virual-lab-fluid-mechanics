import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, CheckCircle2, Activity, Info, AlertCircle, Zap, Shield } from 'lucide-react';

// Reusable components
const OutcomeCard = ({ title, desc }: { title: string; desc: string }) => (
  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
    <h4 className="font-bold text-slate-900">{title}</h4>
    <p className="text-sm text-slate-600">{desc}</p>
  </div>
);

export const VenturiSection1 = ({ onNext, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Learning Outcomes</h2>
      <div className="grid gap-4">
        <OutcomeCard title="Conceptual Understanding" desc="Explain Bernoulli's principle and its application in flow measurement." />
        <OutcomeCard title="Analytical Skills" desc="Analyze pressure differences to determine flow rates." />
        <OutcomeCard title="Practical Competence" desc="Operate virtual Venturimeter and Orifice meter apparatus." />
        <OutcomeCard title="Critical Thinking" desc="Evaluate limitations and sources of error in flow measurement." />
      </div>
      <div className="mt-10 flex justify-end">
        <button onClick={onNext} className="btn-primary flex items-center gap-2">Start Lab <ChevronRight size={20} /></button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection2 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Hook: The Mystery of Flow</h2>
      <p className="text-lg text-slate-600 mb-6">Imagine a pipe carrying water. If you narrow the pipe, the water speeds up. But what happens to the pressure?</p>
      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-900 font-medium italic">
        "Does the pressure increase or decrease when the water speeds up?"
      </div>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection3 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Prediction</h2>
      <p className="text-slate-600 mb-6">Before we start the simulation, what do you think will happen to the pressure at the throat if we increase the flow rate?</p>
      <div className="space-y-4">
        <button className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-blue-600">Pressure will increase</button>
        <button className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-blue-600">Pressure will decrease</button>
        <button className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-blue-600">Pressure will stay the same</button>
      </div>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

import VenturiSimulation from './VenturiSimulation';

// ... (rest of the file)

export const VenturiSection4 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Exploration & Analysis</h2>
      <VenturiSimulation />
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection5 = ({ onNext, onPrev, flowRate, setFlowRate, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Concept / Theory</h2>
      <p className="text-slate-600 mb-6">Bernoulli's Principle states that for an incompressible, non-viscous fluid in a steady flow, the total energy remains constant along a streamline.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection6 = ({ onNext, onPrev, trials, setTrials, flowRate, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Apparatus / System Components</h2>
      <p className="text-slate-600 mb-6">The system consists of a Venturimeter, an Orifice meter, manometers, and a flow control valve.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);
// ... renumbering the rest ...


export const VenturiSection7 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Procedure</h2>
      <p className="text-slate-600 mb-6">1. Open the valve. 2. Observe the manometer readings. 3. Record the flow rate. 4. Repeat for different valve positions.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection8 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Observation / Data Recording</h2>
      <p className="text-slate-600 mb-6">Record your observations in the table below.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection9 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Calculation and Data Analysis</h2>
      <p className="text-slate-600 mb-6">Calculate the discharge coefficient (Cd) using the recorded data.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection10 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Scaffolding Sheet</h2>
      <p className="text-slate-600 mb-6">Need help? Use these hints to guide your analysis.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection11 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Quiz (Knowledge Check)</h2>
      <p className="text-slate-600 mb-6">Test your understanding with these questions.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection12 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Further Tasks / Extensions</h2>
      <p className="text-slate-600 mb-6">Explore the effect of pipe roughness on the pressure drop.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection13 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Critical Evaluation</h2>
      <p className="text-slate-600 mb-6">What are the limitations of the Bernoulli equation in this experiment?</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection14 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Reflection</h2>
      <p className="text-slate-600 mb-6">What was the most surprising observation you made?</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection15 = ({ onNext, onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">References and Further Resources</h2>
      <p className="text-slate-600 mb-6">Check out these resources for deeper study.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  </motion.div>
);

export const VenturiSection16 = ({ onPrev, slidePrefix }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
    <div className="absolute top-0 right-0 text-sm font-mono text-slate-400 p-4">Slide {slidePrefix}</div>
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-8">Feedback</h2>
      <p className="text-slate-600 mb-6">Please provide your feedback on this lab.</p>
      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button className="btn-primary">Submit Feedback</button>
      </div>
    </div>
  </motion.div>
);
