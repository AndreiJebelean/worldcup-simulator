import React, { useState, useEffect } from 'react';
import { generateAllMatches, calculateStandings, calculateThirdPlace } from './utils/matchHelpers';
import GroupTables from './components/GroupTables';
import WildcardTable from './components/WildcardTable';
import MatchFixtures from './components/MatchFixtures';
import logoTrophy from './assets/cup.png'; 

export default function App() {
  const [timezone, setTimezone] = useState('Europe/Berlin'); 
  const [isEditing, setIsEditing] = useState(true);

  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('wc2026_group_matches');
    return saved ? JSON.parse(saved) : generateAllMatches();
  });

  useEffect(() => {
    localStorage.setItem('wc2026_group_matches', JSON.stringify(matches));
  }, [matches]);

  const handleScoreChange = (matchId, field, value) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: value } : m));
  };

  const currentStandings = calculateStandings(matches);
  const thirdPlaceStandings = calculateThirdPlace(currentStandings);

  return (
    <div className="min-h-screen bg-[#02040a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d1527] via-[#02040a] to-[#02040a] text-slate-100 font-sans antialiased relative overflow-x-hidden w-full selection:bg-cyan-500 selection:text-black">
      
      {/* GLOWING AMBIENT FIELD LIGHTS */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[500px] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none" />

      {/* STICKY GLASS HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#040814]/60 border-b border-white/[0.06] px-8 py-3.5 flex flex-col md:flex-row justify-between items-center w-full gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500" />
            <img 
              src={logoTrophy} 
              alt="FIFA World Cup" 
              className="relative h-14 w-auto rounded-lg object-contain bg-black p-0.5 border border-white/10" 
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">
              WORLD CUP 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">SIMULATOR</span>
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-emerald-400/80 uppercase mt-0.5">12 Groups Format • Premium Stage</p>
          </div>
        </div>
        
        <div className="flex items-center gap-5 w-full md:w-auto justify-center md:justify-end">
          <div className="bg-black/40 border border-white/[0.08] p-1 rounded-xl flex items-center text-xs font-bold shadow-inner">
            <button 
              onClick={() => setTimezone('Europe/Berlin')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 tracking-wider ${timezone === 'Europe/Berlin' ? 'bg-white/[0.08] text-white shadow-md border border-white/[0.08]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              DE BERLIN
            </button>
            <button 
              onClick={() => setTimezone('Europe/Bucharest')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 tracking-wider ${timezone === 'Europe/Bucharest' ? 'bg-white/[0.08] text-white shadow-md border border-white/[0.08]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              RO BUCHAREST
            </button>
          </div>

          {/* RECONFIGURED: Modernized contextual color states */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 border backdrop-blur-md ${
              isEditing 
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border-white/10 hover:border-cyan-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
            }`}
          >
            {isEditing ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                💾 SAVE & VIEW
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ⚡ EDIT RESULTS
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CORE CONTAINER: Responsive layouts for desktop structures */}
      <main className="w-full p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT/CENTER STAGE: Groups & Wildcards (9 Columns) */}
        <div className="xl:col-span-9 flex flex-col gap-6 w-full">
          <GroupTables standings={currentStandings} />
          <div className="backdrop-blur-md bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5 shadow-2xl">
            <WildcardTable thirdPlaceStandings={thirdPlaceStandings} />
          </div>
        </div>

        {/* RIGHT STAGE: Match Fixtures / Results Entry Panel (3 Columns) */}
        <div className="xl:col-span-3 xl:sticky xl:top-28 w-full">
          <div className="backdrop-blur-xl bg-[#060b18]/40 border border-white/[0.06] rounded-2xl p-5 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-emerald-500 via-cyan-500 to-blue-500">
            <h3 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase mb-4 text-center border-b border-white/[0.06] pb-3">GROUP FIXTURES (72)</h3>
            <MatchFixtures 
              matches={matches} 
              isEditing={isEditing} 
              timezone={timezone} 
              onScoreChange={handleScoreChange} 
            />
          </div>
        </div>

      </main>
    </div>
  );
}