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

  // Rule: Find the highest ranked available 3rd place team matching the prioritized group order
  const getThirdPlaceTeam = (priorityGroups) => {
    if (!thirdPlaceStandings || thirdPlaceStandings.length === 0) return null;
    
    // Take the top 8 qualified 3rd place teams overall
    const qualifiedThirds = thirdPlaceStandings.slice(0, 8);

    // Find the first group in the match's priority list that successfully qualified
    const targetGroup = priorityGroups.find(g => qualifiedThirds.some(t => t.originGroup === g));
    if (!targetGroup) return null;

    const team = qualifiedThirds.find(t => t.originGroup === targetGroup);
    return team ? { id: team.id, name: team.name, flag: team.flag } : null;
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
  // ROUND OF 32 (EXACT IMAGE MAPPING BY MATCH NUMBER)
  // -------------------------------------------------------------
  const liveR32Matches = useMemo(() => {
    const matches = {
      // --- LEFT SIDE (image_3d6a0e.png) ---
      M74: { home: () => ({ id: 'GER', name: 'Germany', flag: 'de' }), away: () => getThirdPlaceTeam(['A', 'B', 'C', 'D', 'F']) },
      M77: { home: () => getTeam('I', 0), away: () => getThirdPlaceTeam(['C', 'D', 'F', 'G', 'H']) },
      M130: { home: () => ({ id: 'RSA', name: 'South Africa', flag: 'za' }), away: () => ({ id: 'CAN', name: 'Canada', flag: 'ca' }) },
      M75: { home: () => getTeam('F', 0), away: () => ({ id: 'MAR', name: 'Morocco', flag: 'ma' }) },
      M83: { home: () => getTeam('K', 1), away: () => getTeam('L', 1) },
      M84: { home: () => getTeam('H', 0), away: () => getTeam('J', 1) },
      M81: { home: () => ({ id: 'USA', name: 'United States', flag: 'us' }), away: () => getThirdPlaceTeam(['B', 'E', 'F', 'I', 'J']) },
      M82: { home: () => getTeam('G', 0), away: () => getThirdPlaceTeam(['A', 'E', 'H', 'I', 'J']) },

      // --- RIGHT SIDE (image_3dbbe6.png) ---
      M76: { home: () => ({ id: 'BRA', name: 'Brazil', flag: 'br' }), away: () => getTeam('F', 1) },
      M78: { home: () => getTeam('E', 1), away: () => getTeam('I', 1) },
      M79: { home: () => ({ id: 'MEX', name: 'Mexico', flag: 'mx' }), away: () => getThirdPlaceTeam(['C', 'E', 'F', 'H', 'I']) },
      M80: { home: () => getTeam('L', 0), away: () => getThirdPlaceTeam(['E', 'H', 'I', 'J', 'K']) },
      M86: { home: () => ({ id: 'ARG', name: 'Argentina', flag: 'ar' }), away: () => getTeam('H', 1) },
      M88: { home: () => getTeam('D', 1), away: () => getTeam('G', 1) },
      M85: { home: () => ({ id: 'SUI', name: 'Switzerland', flag: 'ch' }), away: () => getThirdPlaceTeam(['E', 'F', 'G', 'I', 'J']) },
      M87: { home: () => getTeam('K', 0), away: () => getThirdPlaceTeam(['D', 'E', 'I', 'J', 'L']) },
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
  }, [standings, thirdPlaceStandings, playoffScores]);

  // -------------------------------------------------------------
  // HIGHER ROUND PROGRESSIONS (EXACTLY AS DIAGRAMMED)
  // -------------------------------------------------------------
  const liveR16Matches = useMemo(() => {
    // Explicit tree paths from images
    const structure = {
      M89: ['M77', 'M83'],  // RD32 W2 & W5 (Visual order slots top-to-bottom)
      M90: ['M74', 'M130'], // RD32 W1 & W3
      M93: ['M83', 'M84'],  // RD32 W11 & W12
      M94: ['M81', 'M82'],  // RD32 W9 & W10
      M91: ['M75', 'M84'],  // RD32 W4 & W6 (Right side mapping starts)
      M92: ['M81', 'M82'],  // RD32 W7 & W8
      M95: ['M86', 'M88'],  // RD32 W14 & W16
      M96: ['M85', 'M87']   // RD32 W13 & W15
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
    const structure = {
      M97: ['M89', 'M90'],  // RD16 W1 & W2
      M98: ['M93', 'M94'],  // RD16 W5 & W6
      M99: ['M91', 'M92'],  // RD16 W3 & W4
      M100: ['M95', 'M96']  // RD16 W7 & W8
    };

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
    const structure = {
      M101: ['M97', 'M98'], // QF W1 & W2
      M102: ['M99', 'M100'] // QF W3 & W4
    };

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
    const saved = playoffScores['M104'] || {};
    const hSource = liveSFMatches['M101'];
    const aSource = liveSFMatches['M102'];
    return {
      id: 'M104',
      home: getWinner('M101', hSource?.home, hSource?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      away: getWinner('M102', aSource?.home, aSource?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      homeScore: saved.homeScore ?? '',
      awayScore: saved.awayScore ?? '',
    };
  }, [liveSFMatches, playoffScores]);

  const champion = useMemo(() => {
    return getWinner('M104', liveFinalMatch.home, liveFinalMatch.away);
  }, [liveFinalMatch, playoffScores]);

  // -------------------------------------------------------------
  // SCANNABLE UI COMPONENTS
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
    if (!match) return null;
    return (
      <div className="w-full bg-[#0d131a] border border-slate-800/70 hover:border-emerald-500/30 rounded-lg p-1.5 shadow-md transition-all flex flex-col relative overflow-hidden group">
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
      {data.map(m => <MatchCard key={m?.id} match={m} />)}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto bg-[#070b0e] p-8 select-none font-sans">
      <div className="relative min-w-[1500px] grid grid-cols-9 gap-5 items-stretch content-center min-h-[760px]">
        
        {/* --- LEFT BRACKET --- */}
        <Column title="Round of 32" data={[liveR32Matches.M74, liveR32Matches.M77, liveR32Matches.M130, liveR32Matches.M75, liveR32Matches.M83, liveR32Matches.M84, liveR32Matches.M81, liveR32Matches.M82]} className="space-y-3" />
        <Column title="Round of 16" data={[liveR16Matches.M89, liveR16Matches.M90, liveR16Matches.M93, liveR16Matches.M94]} className="space-y-14" />
        <Column title="Quarterfinals" data={[liveQFMatches.M97, liveQFMatches.M98]} className="space-y-36" />
        <Column title="Semifinal" data={[liveSFMatches.M101]} className="space-y-0" />

        {/* --- HERO CENTERPIECE --- */}
        <div className="flex flex-col justify-center items-center px-2 self-center space-y-5">
          <div className="w-full flex justify-center items-center pb-2">
            <img src={cupImg} alt="FIFA 2026" className="w-24 h-auto object-contain opacity-90 brightness-95" />
          </div>

          <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="text-[9px] tracking-[0.2em] text-slate-400 font-extrabold mb-3 uppercase">
              TOURNAMENT CHAMPION
            </div>
            <div className={`w-32 h-20 rounded-lg border flex flex-col items-center justify-center transition-all ${
              champion ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950/40 border-slate-800/80 border-dashed'
            }`}>
              {champion ? (
                <div className="flex flex-col items-center space-y-1.5">
                  <img
                    src={`https://flagcdn.com/56x42/${champion.flag?.toLowerCase()}.png`}
                    alt={champion.name}
                    className="w-11 h-7 rounded-sm object-cover shadow border border-black/10"
                  />
                  <span className="text-emerald-400 font-mono text-xs font-bold tracking-wider">{champion.id}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 font-mono font-medium tracking-widest uppercase">Pending</span>
              )}
            </div>
          </div>

          <div className="w-full">
            <div className="text-center text-[10px] tracking-widest text-emerald-400 font-black mb-3 uppercase border-b border-emerald-950 pb-1 w-full">
              FINAL MATCH
            </div>
            <div className="w-full transform scale-105 shadow-xl relative z-10">
              <MatchCard match={liveFinalMatch} />
            </div>
          </div>
        </div>

        {/* --- RIGHT BRACKET --- */}
        <Column title="Semifinal" data={[liveSFMatches.M102]} className="space-y-0" />
        <Column title="Quarterfinals" data={[liveQFMatches.M99, liveQFMatches.M100]} className="space-y-36" />
        <Column title="Round of 16" data={[liveR16Matches.M91, liveR16Matches.M92, liveR16Matches.M95, liveR16Matches.M96]} className="space-y-14" />
        <Column title="Round of 32" data={[liveR32Matches.M76, liveR32Matches.M78, liveR32Matches.M79, liveR32Matches.M80, liveR32Matches.M86, liveR32Matches.M88, liveR32Matches.M85, liveR32Matches.M87]} className="space-y-3" />

      </div>
    </div>
  );
}