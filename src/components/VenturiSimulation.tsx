import React, { useState } from 'react';
import { motion } from 'motion/react';

const VenturiSimulation = () => {
  const [flowRate, setFlowRate] = useState(50); // 0 to 100

  // Manometer levels based on flowRate
  const venturiLevel = flowRate * 0.8;
  const orificeLevel = flowRate * 1.2;

  return (
    <div className="space-y-6">
      {/* Simulation Visualization */}
      <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden h-64 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/lab/800/400')] bg-cover bg-center"></div>
        
        {/* Pipeline Sketch */}
        <div className="relative z-10 w-full h-24 flex items-center justify-between px-4">
          <div className="h-8 bg-slate-400 w-full rounded-full flex items-center justify-between px-4">
            <div className="w-12 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <div className="w-12 h-16 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">O</div>
          </div>
        </div>

        {/* Manometers */}
        <div className="absolute bottom-4 left-10 flex gap-12">
          <div className="flex flex-col items-center">
            <div className="w-4 h-32 bg-slate-700 rounded-t-lg relative">
              <motion.div 
                className="absolute bottom-0 w-full bg-red-600 rounded-b-lg"
                animate={{ height: `${venturiLevel}%` }}
              />
            </div>
            <span className="text-white text-xs mt-2">Venturi</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-32 bg-slate-700 rounded-t-lg relative">
              <motion.div 
                className="absolute bottom-0 w-full bg-red-600 rounded-b-lg"
                animate={{ height: `${orificeLevel}%` }}
              />
            </div>
            <span className="text-white text-xs mt-2">Orifice</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Flow Control Valve</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={flowRate} 
          onChange={(e) => setFlowRate(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Instructional Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h4 className="font-bold text-blue-900">Observe</h4>
          <p className="text-sm text-blue-800">Move the flow control slider slowly. What happens to the manometer levels as flow increases?</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h4 className="font-bold text-amber-900">Predict</h4>
          <p className="text-sm text-amber-800">Before increasing further, predict: Why will the pressure difference (h) change? Which device will show a greater change?</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <h4 className="font-bold text-emerald-900">Learn</h4>
          <p className="text-sm text-emerald-800">As flow increases, velocity at the throat increases, causing pressure to drop (Bernoulli’s principle). This results in a larger manometer reading.</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <h4 className="font-bold text-purple-900">Apply</h4>
          <p className="text-sm text-purple-800">Which device (Venturimeter or Orifice meter) provides more accurate flow measurement? Where are they used in real engineering systems?</p>
        </div>
      </div>
    </div>
  );
};

export default VenturiSimulation;
