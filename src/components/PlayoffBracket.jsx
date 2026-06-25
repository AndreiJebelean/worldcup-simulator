import React, { useState, useEffect, useMemo } from 'react';
import cupImg from '../assets/cup.png';

export default function PlayoffBracket({ standings = {}, thirdPlaceStandings = [] }) {
  const [playoffScores, setPlayoffScores] = useState(() => {
    const saved = localStorage.getItem('wc2026_playoff_scores');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('wc2026_playoff_scores', JSON.stringify(playoffScores));
  }, [playoffScores]);

  const updateScore = (matchId, field, val) => {
    setPlayoffScores(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || {}), [field]: val }
    }));
  };

  // -----------------------------
  // GROUP LOOKUP
  // -----------------------------
  const getTeamFromStandings = (groupLetter, rankIndex) => {
    const groupKey = `Group ${groupLetter}`;
    const groupTeams = standings[groupKey];

    if (groupTeams && groupTeams[rankIndex]) {
      const team = groupTeams[rankIndex];
      return {
        id: team.id,
        name: team.name,
        flag: team.flag
      };
    }
    return null;
  };

  // -----------------------------
  // THIRD PLACE LOGIC (FULLY AUTOMATIC)
  // -----------------------------
  const rankedThirds = useMemo(() => {
    if (!thirdPlaceStandings) return [];
    return [...thirdPlaceStandings].slice(0, 8);
  }, [thirdPlaceStandings]);

  const groupSet = useMemo(() => {
    return new Set(rankedThirds.map(t => t.originGroup));
  }, [rankedThirds]);

  const resolveThirdPlace = (slotGroups) => {
    if (!slotGroups) return null;
    return slotGroups.find(g => groupSet.has(g)) || null;
  };

  const getThirdPlaceTeam = (slot) => {
    const SLOT_RULES = {
      GER: ["A", "B", "C", "D", "E", "F"],
      SLOT_3: ["C", "D", "E", "F", "G", "H"],
      SLOT_4: ["A", "C", "E", "F", "G"],
      SLOT_5: ["E", "F", "G", "H", "I"],
      SLOT_6: ["A", "E", "F", "G", "H"],
      USA: ["B", "E", "F", "I", "J"],
      SLOT_7: ["D", "E", "F", "G", "H"],
      SLOT_8: ["D", "E", "I", "J", "L"]
    };

    const possibleGroups = SLOT_RULES[slot];
    const group = resolveThirdPlace(possibleGroups);
    return rankedThirds.find(t => t.originGroup === group) || null;
  };

  const getStageWinner = (matchId, fallbackHome, fallbackAway) => {
    const scoreState = playoffScores[matchId];
    if (!scoreState) return null;

    const s1 = parseInt(scoreState.homeScore, 10);
    const s2 = parseInt(scoreState.awayScore, 10);

    if (isNaN(s1) || isNaN(s2)) return null;
    if (s1 > s2) return fallbackHome?.id !== 'TBD' ? fallbackHome : null;
    if (s2 > s1) return fallbackAway?.id !== 'TBD' ? fallbackAway : null;
    return null;
  };

  // -----------------------------
  // PROGRESSIVE BRACKET MATCH DATA
  // -----------------------------
  const liveR32Matches = useMemo(() => {
    const baseR32Layout = [
      { id: 'R32_1', home: () => getTeamFromStandings('A', 1), away: () => getTeamFromStandings('B', 1) },
      { id: 'R32_2', home: () => getTeamFromStandings('C', 0), away: () => getTeamFromStandings('F', 1) },
      { id: 'R32_3', home: () => ({ id: 'GER', name: 'Germany', flag: 'de' }), away: () => getThirdPlaceTeam('GER') },
      { id: 'R32_4', home: () => getTeamFromStandings('F', 0), away: () => getTeamFromStandings('C', 1) },
      { id: 'R32_5', home: () => getTeamFromStandings('E', 1), away: () => getTeamFromStandings('I', 1) },
      { id: 'R32_6', home: () => getTeamFromStandings('I', 0), away: () => getThirdPlaceTeam('SLOT_3') },
      { id: 'R32_7', home: () => ({ id: 'MEX', name: 'Mexico', flag: 'mx' }), away: () => getThirdPlaceTeam('SLOT_4') },
      { id: 'R32_8', home: () => getTeamFromStandings('L', 0), away: () => getThirdPlaceTeam('SLOT_5') },

      { id: 'R32_9', home: () => getTeamFromStandings('G', 0), away: () => getThirdPlaceTeam('SLOT_6') },
      { id: 'R32_10', home: () => ({ id: 'USA', name: 'United States', flag: 'us' }), away: () => getThirdPlaceTeam('USA') },
      { id: 'R32_11', home: () => getTeamFromStandings('H', 0), away: () => getTeamFromStandings('J', 1) },
      { id: 'R32_12', home: () => getTeamFromStandings('K', 1), away: () => getTeamFromStandings('L', 1) },
      { id: 'R32_13', home: () => getTeamFromStandings('B', 0), away: () => getThirdPlaceTeam('SLOT_7') },
      { id: 'R32_14', home: () => getTeamFromStandings('D', 1), away: () => getTeamFromStandings('G', 1) },
      { id: 'R32_15', home: () => ({ id: 'ARG', name: 'Argentina', flag: 'ar' }), away: () => getTeamFromStandings('H', 1) },
      { id: 'R32_16', home: () => getTeamFromStandings('K', 0), away: () => getThirdPlaceTeam('SLOT_8') },
    ];

    return baseR32Layout.map(m => {
      const saved = playoffScores[m.id] || {};
      return {
        id: m.id,
        home: m.home() || { id: 'TBD', name: 'TBD', flag: '' },
        away: m.away() || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
    });
  }, [standings, rankedThirds, groupSet, playoffScores]);

  const liveR16Matches = useMemo(() => {
    const pairings = [
      { id: 'R16_1', p: ['R32_1', 'R32_2'] }, { id: 'R16_2', p: ['R32_3', 'R32_4'] },
      { id: 'R16_3', p: ['R32_5', 'R32_6'] }, { id: 'R16_4', p: ['R32_7', 'R32_8'] },
      { id: 'R16_5', p: ['R32_9', 'R32_10'] }, { id: 'R16_6', p: ['R32_11', 'R32_12'] },
      { id: 'R16_7', p: ['R32_13', 'R32_14'] }, { id: 'R16_8', p: ['R32_15', 'R32_16'] },
    ];
    return pairings.map(m => {
      const saved = playoffScores[m.id] || {};
      const hMatch = liveR32Matches.find(r => r.id === m.p[0]);
      const aMatch = liveR32Matches.find(r => r.id === m.p[1]);
      return {
        id: m.id,
        home: getStageWinner(m.p[0], hMatch?.home, hMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getStageWinner(m.p[1], aMatch?.home, aMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
    });
  }, [liveR32Matches, playoffScores]);

  const liveQFMatches = useMemo(() => {
    const pairings = [
      { id: 'QF_1', p: ['R16_1', 'R16_2'] }, { id: 'QF_2', p: ['R16_3', 'R16_4'] },
      { id: 'QF_3', p: ['R16_5', 'R16_6'] }, { id: 'QF_4', p: ['R16_7', 'R16_8'] },
    ];
    return pairings.map(m => {
      const saved = playoffScores[m.id] || {};
      const hMatch = liveR16Matches.find(r => r.id === m.p[0]);
      const aMatch = liveR16Matches.find(r => r.id === m.p[1]);
      return {
        id: m.id,
        home: getStageWinner(m.p[0], hMatch?.home, hMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getStageWinner(m.p[1], aMatch?.home, aMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
    });
  }, [liveR16Matches, playoffScores]);

  const liveSFMatches = useMemo(() => {
    const pairings = [
      { id: 'SF_1', p: ['QF_1', 'QF_2'] }, { id: 'SF_2', p: ['QF_3', 'QF_4'] }
    ];
    return pairings.map(m => {
      const saved = playoffScores[m.id] || {};
      const hMatch = liveQFMatches.find(r => r.id === m.p[0]);
      const aMatch = liveQFMatches.find(r => r.id === m.p[1]);
      return {
        id: m.id,
        home: getStageWinner(m.p[0], hMatch?.home, hMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getStageWinner(m.p[1], aMatch?.home, aMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
    });
  }, [liveQFMatches, playoffScores]);

  const liveFinalMatch = useMemo(() => {
    const saved = playoffScores['FINAL'] || {};
    return [{
      id: 'FINAL',
      home: getStageWinner('SF_1', liveSFMatches[0]?.home, liveSFMatches[0]?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      away: getStageWinner('SF_2', liveSFMatches[1]?.home, liveSFMatches[1]?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      homeScore: saved.homeScore ?? '',
      awayScore: saved.awayScore ?? '',
    }];
  }, [liveSFMatches, playoffScores]);

  const champion = useMemo(() => {
    const f = liveFinalMatch[0];
    return getStageWinner('FINAL', f.home, f.away);
  }, [liveFinalMatch, playoffScores]);

  // -----------------------------
  // CLEAN COMPONENTS
  // -----------------------------
  const TeamRow = ({ team }) => {
    const isTBD = !team || team.id === 'TBD';
    return (
      <div className="flex items-center justify-between w-full h-7 px-2">
        <div className="flex items-center gap-3">
          {isTBD ? (
            <div className="w-5 h-3.5 bg-slate-800/60 rounded-sm border border-slate-700/50" />
          ) : (
            <img
              src={`https://flagcdn.com/20x15/${team.flag?.toLowerCase()}.png`}
              alt={team.id}
              className="rounded-sm object-cover w-5 h-3.5 shadow-sm border border-black/10"
            />
          )}
          <span className={`text-xs font-mono tracking-wide ${isTBD ? 'text-slate-500 font-medium' : 'text-slate-200 font-bold'}`}>
            {team?.id || 'TBD'}
          </span>
        </div>
      </div>
    );
  };

  const MatchCard = ({ match }) => {
    return (
      <div className="w-full bg-[#0d131a] border border-slate-800/70 hover:border-emerald-500/30 rounded-lg p-1.5 shadow-md transition-all flex flex-col relative overflow-hidden group">
        {/* Subtle accent indicator line on active matches */}
        <div className="absolute top-0 left-0 h-full w-[2px] bg-emerald-500/0 group-hover:bg-emerald-500/40 transition-all" />
        
        <div className="flex items-center justify-between">
          <TeamRow team={match.home} />
          <input
            className="w-8 h-6 text-center text-xs bg-slate-900 border border-slate-800 rounded text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500/50"
            value={match.homeScore}
            maxLength={2}
            onChange={e => updateScore(match.id, 'homeScore', e.target.value)}
          />
        </div>
        
        <div className="h-[1px] bg-slate-800/40 my-1 w-[90%] mx-auto" />

        <div className="flex items-center justify-between">
          <TeamRow team={match.away} />
          <input
            className="w-8 h-6 text-center text-xs bg-slate-900 border border-slate-800 rounded text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500/50"
            value={match.awayScore}
            maxLength={2}
            onChange={e => updateScore(match.id, 'awayScore', e.target.value)}
          />
        </div>
      </div>
    );
  };

  const Column = ({ title, data, className = "space-y-6" }) => (
    <div className={`flex flex-col justify-center h-full ${className}`}>
      <div className="text-center text-[10px] tracking-widest text-slate-400 font-bold mb-3 uppercase border-b border-slate-800/80 pb-1.5 font-sans">
        {title}
      </div>
      {data.map(m => <MatchCard key={m.id} match={m} />)}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto bg-[#070b0e] p-8 select-none font-sans">
      <div className="relative min-w-[1500px] grid grid-cols-9 gap-5 items-stretch content-center min-h-[760px]">
        
        {/* LEFT BRACKET BRIDGES */}
        <Column title="Round of 32" data={liveR32Matches.slice(0, 8)} className="space-y-3" />
        <Column title="Round of 16" data={liveR16Matches.slice(0, 4)} className="space-y-14" />
        <Column title="Quarterfinals" data={liveQFMatches.slice(0, 2)} className="space-y-36" />
        <Column title="Semifinal" data={[liveSFMatches[0]]} className="space-y-0" />

        {/* REFINED CENTRAL SHOWCASE NODE */}
        <div className="flex flex-col justify-center items-center px-2 self-center space-y-5">
          
          {/* Logo Brand Frame */}
          <div className="w-full flex justify-center items-center pb-2">
            <img 
              src={cupImg} 
              alt="FIFA 2026" 
              className="w-24 h-auto object-contain opacity-90 brightness-95"
            />
          </div>

          {/* Premium Static Podium Container */}
          <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="text-[9px] tracking-[0.2em] text-slate-400 font-extrabold mb-3 uppercase">
              TOURNAMENT CHAMPION
            </div>
            
            <div className={`w-32 h-20 rounded-lg border flex flex-col items-center justify-center transition-all ${
              champion 
                ? 'bg-emerald-950/20 border-emerald-500/30' 
                : 'bg-slate-950/40 border-slate-800/80 border-dashed'
            }`}>
              {champion ? (
                <div className="flex flex-col items-center space-y-1.5">
                  <img
                    src={`https://flagcdn.com/56x42/${champion.flag?.toLowerCase()}.png`}
                    alt={champion.name}
                    className="w-11 h-7 rounded-sm object-cover shadow border border-black/10"
                  />
                  <span className="text-emerald-400 font-mono text-xs font-bold tracking-wider">
                    {champion.id}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 font-mono font-medium tracking-widest uppercase">
                  Pending
                </span>
              )}
            </div>
          </div>

          {/* Final Matchup Area */}
          <div className="w-full">
            <div className="text-center text-[10px] tracking-widest text-emerald-400 font-black mb-3 uppercase border-b border-emerald-950 pb-1 w-full">
              FINAL MATCH
            </div>
            <div className="w-full transform scale-105 shadow-xl relative z-10">
              <MatchCard match={liveFinalMatch[0]} />
            </div>
          </div>
        </div>

        {/* RIGHT BRACKET BRIDGES */}
        <Column title="Semifinal" data={[liveSFMatches[1]]} className="space-y-0" />
        <Column title="Quarterfinals" data={liveQFMatches.slice(2, 4)} className="space-y-36" />
        <Column title="Round of 16" data={liveR16Matches.slice(4, 8)} className="space-y-14" />
        <Column title="Round of 32" data={liveR32Matches.slice(8, 16)} className="space-y-3" />

      </div>
    </div>
  );
}