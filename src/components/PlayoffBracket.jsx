import React, { useState, useEffect, useMemo } from 'react';

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

  // Helper helper to pull dynamic winners for structural progression
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
  // R32 SETUP
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

  // -----------------------------
  // PROGRESSIVE HIGHER STAGES
  // -----------------------------
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
      { id: 'SF_1', p: ['QF_1', 'QF_2'] },
      { id: 'SF_2', p: ['QF_3', 'QF_4'] }
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
    const hMatch = liveSFMatches[0];
    const aMatch = liveSFMatches[1];
    return [{
      id: 'FINAL',
      home: getStageWinner('SF_1', hMatch?.home, hMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      away: getStageWinner('SF_2', aMatch?.home, aMatch?.away) || { id: 'TBD', name: 'TBD', flag: '' },
      homeScore: saved.homeScore ?? '',
      awayScore: saved.awayScore ?? '',
    }];
  }, [liveSFMatches, playoffScores]);

  // -----------------------------
  // UI DISPLAY COMPONENTS
  // -----------------------------
  const TeamRow = ({ team }) => {
    const isTBD = !team || team.id === 'TBD';
    return (
      <div className="flex items-center gap-2.5 w-full justify-start">
        {isTBD ? (
          <div className="w-5 h-[14px] bg-white/5 border border-white/10 rounded-sm shrink-0" />
        ) : (
          <img
            src={`https://flagcdn.com/20x15/${team.flag?.toLowerCase()}.png`}
            alt={team.id}
            className="rounded-sm object-cover shadow-sm border border-gray-800 w-5 h-[14px] shrink-0"
          />
        )}
        <span className={`font-mono tracking-wide text-xs ${isTBD ? 'text-gray-500 font-medium' : 'text-slate-200 font-bold'}`}>
          {team?.id || 'TBD'}
        </span>
      </div>
    );
  };

  const MatchCard = ({ match }) => {
    return (
      <div className="relative backdrop-blur-md bg-white/[0.02] border border-white/5 rounded-xl p-3 shadow-xl hover:border-cyan-500/30 transition-all flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <TeamRow team={match.home} />
          <input
            className="w-9 h-7 text-center text-xs bg-black/40 border border-white/5 rounded-md text-green-400 font-mono font-bold focus:outline-none focus:border-cyan-500/50"
            value={match.homeScore}
            onChange={e => updateScore(match.id, 'homeScore', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <TeamRow team={match.away} />
          <input
            className="w-9 h-7 text-center text-xs bg-black/40 border border-white/5 rounded-md text-green-400 font-mono font-bold focus:outline-none focus:border-cyan-500/50"
            value={match.awayScore}
            onChange={e => updateScore(match.id, 'awayScore', e.target.value)}
          />
        </div>
      </div>
    );
  };

  const Column = ({ title, data, className = "space-y-6" }) => (
    <div className={`flex flex-col justify-center h-full ${className}`}>
      <div className="text-center text-[10px] tracking-widest text-cyan-400/80 font-black mb-2 uppercase border-b border-white/5 pb-1">
        {title}
      </div>
      {data.map(m => <MatchCard key={m.id} match={m} />)}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto bg-[#02040a] p-8 select-none">
      <div className="min-w-[1500px] grid grid-cols-9 gap-4 items-stretch content-center min-h-[720px]">
        
        {/* LEFT PATH */}
        <Column title="Round of 32" data={liveR32Matches.slice(0, 8)} className="space-y-4" />
        <Column title="Round of 16" data={liveR16Matches.slice(0, 4)} className="space-y-16" />
        <Column title="Quarterfinals" data={liveQFMatches.slice(0, 2)} className="space-y-40" />
        <Column title="Semifinal" data={[liveSFMatches[0]]} className="space-y-0" />

        {/* CENTRAL NODE */}
        <div className="flex flex-col justify-center items-center px-2">
          <div className="text-center text-[11px] tracking-widest text-yellow-400 font-black mb-4 uppercase border-b border-yellow-500/20 pb-1 w-full">
            🏆 WORLD CUP FINAL
          </div>
          <div className="w-full transform scale-110 shadow-2xl">
            <MatchCard match={liveFinalMatch[0]} />
          </div>
        </div>

        {/* RIGHT PATH */}
        <Column title="Semifinal" data={[liveSFMatches[1]]} className="space-y-0" />
        <Column title="Quarterfinals" data={liveQFMatches.slice(2, 4)} className="space-y-40" />
        <Column title="Round of 16" data={liveR16Matches.slice(4, 8)} className="space-y-16" />
        <Column title="Round of 32" data={liveR32Matches.slice(8, 16)} className="space-y-4" />

      </div>
    </div>
  );
}