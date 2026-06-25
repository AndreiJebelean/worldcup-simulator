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

  // -------------------------------------------------------------
  // CORE SEEDING HELPERS
  // -------------------------------------------------------------
  const getTeam = (groupLetter, rank) => {
    const groupKey = `Group ${groupLetter}`;
    const groupTeams = standings[groupKey];
    if (groupTeams && groupTeams[rank]) {
      return {
        id: groupTeams[rank].id,
        name: groupTeams[rank].name,
        flag: groupTeams[rank].flag
      };
    }
    return null;
  };

  const getWinner = (matchId, fallbackHome, fallbackAway) => {
    const scoreState = playoffScores[matchId];
    if (!scoreState) return null;
    const s1 = parseInt(scoreState.homeScore, 10);
    const s2 = parseInt(scoreState.awayScore, 10);
    if (isNaN(s1) || isNaN(s2)) return null;
    if (s1 > s2) return fallbackHome?.id !== 'TBD' ? fallbackHome : null;
    if (s2 > s1) return fallbackAway?.id !== 'TBD' ? fallbackAway : null;
    return null;
  };

  // -------------------------------------------------------------
  // STRICT MATCH ID PRIORITY COLLISION RESOLVER
  // -------------------------------------------------------------
  const resolvedThirdPlaceMatches = useMemo(() => {
    if (!thirdPlaceStandings || thirdPlaceStandings.length === 0) return {};

    const qualifiedThirds = thirdPlaceStandings.slice(0, 8);
    const allocatedTeamIds = new Set();
    const allocations = {};

    // Evaluated strictly by incremental Match ID priority rules
    const matchNumericalOrder = [
      { id: 'M74', pools: ['A', 'B', 'C', 'D', 'F'] }, // M74 has absolute first pick of the top 8 list
      { id: 'M77', pools: ['C', 'D', 'F', 'G', 'H'] },
      { id: 'M79', pools: ['C', 'E', 'F', 'H', 'I'] },
      { id: 'M80', pools: ['E', 'H', 'I', 'J', 'K'] },
      { id: 'M81', pools: ['B', 'E', 'F', 'I', 'J'] },
      { id: 'M82', pools: ['A', 'E', 'H', 'I', 'J'] },
      { id: 'M85', pools: ['E', 'F', 'G', 'I', 'J'] },
      { id: 'M87', pools: ['D', 'E', 'I', 'J', 'L'] }
    ];

    matchNumericalOrder.forEach(({ id, pools }) => {
      // Find the absolute highest ranked third place team that is eligible and unpicked
      const matchedTeam = qualifiedThirds.find(team => 
        pools.includes(team.originGroup) && !allocatedTeamIds.has(team.id)
      );

      if (matchedTeam) {
        allocations[id] = { id: matchedTeam.id, name: matchedTeam.name, flag: matchedTeam.flag };
        allocatedTeamIds.add(matchedTeam.id);
      } else {
        allocations[id] = { id: 'TBD', name: 'TBD', flag: '' };
      }
    });

    return allocations;
  }, [thirdPlaceStandings]);

  // -------------------------------------------------------------
  // ROUND OF 32 (RENDER IN VISUAL TREE LAYOUT ORDER)
  // -------------------------------------------------------------
  const liveR32Matches = useMemo(() => {
    const matches = {
      // --- LEFT SIDE (image_3dceef.png) ---
      M74: { home: () => ({ id: 'GER', name: 'Germany', flag: 'de' }), away: () => resolvedThirdPlaceMatches.M74 },
      M77: { home: () => getTeam('I', 0), away: () => resolvedThirdPlaceMatches.M77 },
      M130: { home: () => ({ id: 'RSA', name: 'South Africa', flag: 'za' }), away: () => ({ id: 'CAN', name: 'Canada', flag: 'ca' }) },
      M75: { home: () => getTeam('F', 0), away: () => ({ id: 'MAR', name: 'Morocco', flag: 'ma' }) },
      M83: { home: () => getTeam('K', 1), away: () => getTeam('L', 1) },
      M84: { home: () => getTeam('H', 0), away: () => getTeam('J', 1) },
      M81: { home: () => ({ id: 'USA', name: 'United States', flag: 'us' }), away: () => resolvedThirdPlaceMatches.M81 },
      M82: { home: () => getTeam('G', 0), away: () => resolvedThirdPlaceMatches.M82 },

      // --- RIGHT SIDE (image_3dcf6a.png) ---
      M76: { home: () => ({ id: 'BRA', name: 'Brazil', flag: 'br' }), away: () => getTeam('F', 1) },
      M78: { home: () => getTeam('E', 1), away: () => getTeam('I', 1) },
      M79: { home: () => ({ id: 'MEX', name: 'Mexico', flag: 'mx' }), away: () => resolvedThirdPlaceMatches.M79 },
      M80: { home: () => getTeam('L', 0), away: () => resolvedThirdPlaceMatches.M80 },
      M86: { home: () => ({ id: 'ARG', name: 'Argentina', flag: 'ar' }), away: () => getTeam('H', 1) },
      M88: { home: () => getTeam('D', 1), away: () => getTeam('G', 1) },
      M85: { home: () => ({ id: 'SUI', name: 'Switzerland', flag: 'ch' }), away: () => resolvedThirdPlaceMatches.M85 },
      M87: { home: () => getTeam('K', 0), away: () => resolvedThirdPlaceMatches.M87 },
    };

    return Object.keys(matches).reduce((acc, mId) => {
      const saved = playoffScores[mId] || {};
      acc[mId] = {
        id: mId,
        home: matches[mId].home() || { id: 'TBD', name: 'TBD', flag: '' },
        away: matches[mId].away() || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
      return acc;
    }, {});
  }, [standings, resolvedThirdPlaceMatches, playoffScores]);

  // -------------------------------------------------------------
  // HIGHER ROUND PROGRESSIONS
  // -------------------------------------------------------------
  const liveR16Matches = useMemo(() => {
    const structure = {
      M89: ['M74', 'M77'], M90: ['M130', 'M75'], M93: ['M83', 'M84'], M94: ['M81', 'M82'],
      M91: ['M76', 'M78'], M92: ['M79', 'M80'], M95: ['M86', 'M88'], M96: ['M85', 'M87']
    };

    return Object.keys(structure).reduce((acc, mId) => {
      const saved = playoffScores[mId] || {};
      const hSource = liveR32Matches[structure[mId][0]];
      const aSource = liveR32Matches[structure[mId][1]];
      acc[mId] = {
        id: mId,
        home: getWinner(hSource.id, hSource.home, hSource.away) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getWinner(aSource.id, aSource.home, aSource.away) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
      return acc;
    }, {});
  }, [liveR32Matches, playoffScores]);

  const liveQFMatches = useMemo(() => {
    const structure = { M97: ['M89', 'M90'], M98: ['M93', 'M94'], M99: ['M91', 'M92'], M100: ['M95', 'M96'] };
    return Object.keys(structure).reduce((acc, mId) => {
      const saved = playoffScores[mId] || {};
      const hSource = liveR16Matches[structure[mId][0]];
      const aSource = liveR16Matches[structure[mId][1]];
      acc[mId] = {
        id: mId,
        home: getWinner(hSource.id, hSource.home, hSource.away) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getWinner(aSource.id, aSource.home, aSource.away) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
      return acc;
    }, {});
  }, [liveR16Matches, playoffScores]);

  const liveSFMatches = useMemo(() => {
    const structure = { M101: ['M97', 'M98'], M102: ['M99', 'M100'] };
    return Object.keys(structure).reduce((acc, mId) => {
      const saved = playoffScores[mId] || {};
      const hSource = liveQFMatches[structure[mId][0]];
      const aSource = liveQFMatches[structure[mId][1]];
      acc[mId] = {
        id: mId,
        home: getWinner(hSource.id, hSource.home, hSource.away) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getWinner(aSource.id, aSource.home, aSource.away) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
      };
      return acc;
    }, {});
  }, [liveQFMatches, playoffScores]);

  const liveFinalMatch = useMemo(() => {
    const saved = playoffScores['M103'] || {};
    const hSource = liveSFMatches['M101'];
    const aSource = liveSFMatches['M102'];
    return {
      id: 'M103',
      home: getWinner('M101', hSource?.home, hSource?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      away: getWinner('M102', aSource?.home, aSource?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      homeScore: saved.homeScore ?? '',
      awayScore: saved.awayScore ?? '',
    };
  }, [liveSFMatches, playoffScores]);

  const champion = useMemo(() => getWinner('M103', liveFinalMatch.home, liveFinalMatch.away), [liveFinalMatch]);

  // -------------------------------------------------------------
  // RENDERING COMPONENTS
  // -------------------------------------------------------------
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
              className="rounded-sm object-cover w-5 h-3.5 border border-black/10"
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
    if (!match) return null;
    return (
      <div className="w-full bg-[#0d131a] border border-slate-800/70 hover:border-emerald-500/30 rounded-lg p-1.5 shadow-md flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 left-0 h-full w-[2px] bg-emerald-500/0 group-hover:bg-emerald-500/40 transition-all" />
        <div className="flex items-center justify-between mb-0.5 px-1">
          <span className="text-[9px] text-slate-600 font-mono font-bold uppercase tracking-wider">{match.id === 'M130' ? 'Match CAN-130' : `Match ${match.id}`}</span>
        </div>
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
      <div className="text-center text-[10px] tracking-widest text-slate-400 font-bold mb-3 uppercase border-b border-slate-800/80 pb-1.5">
        {title}
      </div>
      {data.map(m => <MatchCard key={m?.id} match={m} />)}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto bg-[#070b0e] p-8 select-none">
      <div className="relative min-w-[1500px] grid grid-cols-9 gap-5 items-stretch content-center min-h-[820px]">
        
        {/* LEFT SIDE BRACKET */}
        <Column title="Round of 32" data={[liveR32Matches.M74, liveR32Matches.M77, liveR32Matches.M130, liveR32Matches.M75, liveR32Matches.M83, liveR32Matches.M84, liveR32Matches.M81, liveR32Matches.M82]} className="space-y-3" />
        <Column title="Round of 16" data={[liveR16Matches.M89, liveR16Matches.M90, liveR16Matches.M93, liveR16Matches.M94]} className="space-y-16" />
        <Column title="Quarterfinals" data={[liveQFMatches.M97, liveQFMatches.M98]} className="space-y-40" />
        <Column title="Semifinal" data={[liveSFMatches.M101]} className="space-y-0" />

        {/* HERO CENTERPIECE */}
        <div className="flex flex-col justify-center items-center px-2 self-center space-y-5">
          <div className="w-full flex justify-center items-center pb-2">
            <img src={cupImg} alt="FIFA 2026" className="w-24 h-auto object-contain opacity-90" />
          </div>
          <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="text-[9px] tracking-[0.2em] text-slate-400 font-extrabold mb-3 uppercase">TOURNAMENT CHAMPION</div>
            <div className={`w-32 h-20 rounded-lg border flex flex-col items-center justify-center transition-all ${champion ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950/40 border-slate-800/80 border-dashed'}`}>
              {champion ? (
                <div className="flex flex-col items-center space-y-1.5">
                  <img src={`https://flagcdn.com/56x42/${champion.flag?.toLowerCase()}.png`} alt={champion.name} className="w-11 h-7 rounded-sm object-cover shadow border border-black/10" />
                  <span className="text-emerald-400 font-mono text-xs font-bold tracking-wider">{champion.id}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 font-mono font-medium tracking-widest uppercase">Pending</span>
              )}
            </div>
          </div>
          <div className="w-full">
            <div className="text-center text-[10px] tracking-widest text-emerald-400 font-black mb-3 uppercase border-b border-emerald-950 pb-1 w-full">FINAL MATCH</div>
            <div className="w-full transform scale-105 shadow-xl relative z-10">
              <MatchCard match={liveFinalMatch} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE BRACKET */}
        <Column title="Semifinal" data={[liveSFMatches.M102]} className="space-y-0" />
        <Column title="Quarterfinals" data={[liveQFMatches.M99, liveQFMatches.M100]} className="space-y-40" />
        <Column title="Round of 16" data={[liveR16Matches.M91, liveR16Matches.M92, liveR16Matches.M95, liveR16Matches.M96]} className="space-y-16" />
        <Column title="Round of 32" data={[liveR32Matches.M76, liveR32Matches.M78, liveR32Matches.M79, liveR32Matches.M80, liveR32Matches.M86, liveR32Matches.M88, liveR32Matches.M85, liveR32Matches.M87]} className="space-y-3" />

      </div>
    </div>
  );
}