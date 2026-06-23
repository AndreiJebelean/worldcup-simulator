import React from 'react';
import { Link } from 'react-router-dom';
import { calculateStandings, calculateThirdPlace } from '../utils/matchHelpers';
import PlayoffBracket from '../components/PlayoffBracket';

export default function PlayoffPage() {
  // Pull existing matches live from the Group Stage Simulator data
  const matches = JSON.parse(localStorage.getItem('wc2026_group_matches') || '[]');
  
  // Calculate standings maps and find the top 8 performing third-place entries
  const standings = calculateStandings(matches);
  const thirdPlaceStandings = calculateThirdPlace(standings);

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 p-6 selection:bg-cyan-500/30">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-8 border-b border-white/[0.05] pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            KNOCKOUT STAGES
          </h1>
          <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase mt-1">
            FIFA World Cup 2026 Simulator
          </p>
        </div>

        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md text-slate-200 hover:text-white hover:bg-white/[0.06] hover:border-white/20 text-xs font-bold tracking-wider uppercase transition-all"
        >
          ← Return to Groups
        </Link>
      </div>

      {/* Main Bracket Interactive Arena */}
      <div className="p-4 rounded-2xl bg-[#040814]/40 border border-white/[0.02]">
        <PlayoffBracket standings={standings} thirdPlaceStandings={thirdPlaceStandings} />
      </div>
      
    </div>
  );
}