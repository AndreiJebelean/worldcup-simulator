import React, { useState, useEffect, useMemo } from 'react';

export default function PlayoffBracket({ standings = {}, thirdPlaceStandings = [] }) {
  const [playoffScores, setPlayoffScores] = useState(() => {
    const saved = localStorage.getItem('wc2026_playoff_scores');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('wc2026_playoff_scores', JSON.stringify(playoffScores));
  }, [playoffScores]);

  const updateScore = (id, field, val) => {
    setPlayoffScores(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: val }
    }));
  };

  // -------------------------
  // TEAM LOOKUP
  // -------------------------
  const getTeamFromStandings = (groupLetter, index) => {
    const groupKey = `Group ${groupLetter}`;
    const team = standings[groupKey]?.[index];
    if (!team) return null;

    return {
      id: team.id,
      name: team.name,
      flag: team.flag
    };
  };

  const getThird = (index) => {
    const team = thirdPlaceStandings?.[index];
    if (!team) return null;

    return {
      id: team.id,
      name: team.name,
      flag: team.flag
    };
  };

  // helper function to resolve dynamic winners to feed subsequent rounds
  const getWinnerOfMatch = (matchId) => {
    const saved = playoffScores[matchId];
    if (!saved) return null;
    const s1 = parseInt(saved.homeScore, 10);
    const s2 = parseInt(saved.awayScore, 10);
    if (isNaN(s1) || isNaN(s2)) return null;

    // locate data from original R32 layout mapping
    const originalMatch = liveR32.find(m => m.id === matchId);
    if (!originalMatch) return null;

    if (s1 > s2) return originalMatch.home.id !== 'TBD' ? originalMatch.home : null;
    if (s2 > s1) return originalMatch.away.id !== 'TBD' ? originalMatch.away : null;
    return null; 
  };

  const getWinnerOfStage = (stageId, pairsArray, prevStageWinnerFunc) => {
    const saved = playoffScores[stageId];
    if (!saved) return null;
    const s1 = parseInt(saved.homeScore, 10);
    const s2 = parseInt(saved.awayScore, 10);
    if (isNaN(s1) || isNaN(s2)) return null;

    const homeTeam = prevStageWinnerFunc(pairsArray[0]);
    const awayTeam = prevStageWinnerFunc(pairsArray[1]);

    if (s1 > s2) return homeTeam;
    if (s2 > s1) return awayTeam;
    return null;
  };

  // -------------------------
  // PLAYOFF TREE PROGRESSION LOGIC
  // -------------------------
  const liveR32 = useMemo(() => {
    const layout = [
      { id: 'R32_1', h: () => getTeamFromStandings('A', 1), a: () => getTeamFromStandings('B', 1) },
      { id: 'R32_2', h: () => getTeamFromStandings('C', 0), a: () => getTeamFromStandings('F', 1) },
      { id: 'R32_3', h: () => ({ id: 'GER', name: 'GER', flag: 'de' }), a: () => getThird(0) },
      { id: 'R32_4', h: () => getTeamFromStandings('F', 0), a: () => getTeamFromStandings('C', 1) },
      { id: 'R32_5', h: () => getTeamFromStandings('E', 1), a: () => getTeamFromStandings('I', 1) },
      { id: 'R32_6', h: () => getTeamFromStandings('I', 0), a: () => getThird(1) },
      { id: 'R32_7', h: () => ({ id: 'MEX', name: 'MEX', flag: 'mx' }), a: () => getThird(2) },
      { id: 'R32_8', h: () => getTeamFromStandings('L', 0), a: () => getThird(3) },

      { id: 'R32_9', h: () => getTeamFromStandings('G', 0), a: () => getThird(4) },
      { id: 'R32_10', h: () => ({ id: 'USA', name: 'USA', flag: 'us' }), a: () => getThird(5) },
      { id: 'R32_11', h: () => getTeamFromStandings('H', 0), a: () => getTeamFromStandings('J', 1) },
      { id: 'R32_12', h: () => getTeamFromStandings('K', 1), a: () => getTeamFromStandings('L', 1) },
      { id: 'R32_13', h: () => getTeamFromStandings('B', 0), a: () => getThird(6) },
      { id: 'R32_14', h: () => getTeamFromStandings('D', 1), a: () => getTeamFromStandings('G', 1) },
      { id: 'R32_15', h: () => ({ id: 'ARG', name: 'ARG', flag: 'ar' }), a: () => getTeamFromStandings('H', 1) },
      { id: 'R32_16', h: () => getTeamFromStandings('K', 0), a: () => getThird(7) },
    ];

    return layout.map(m => {
      const saved = playoffScores[m.id] || {};
      return {
        id: m.id,
        home: m.h() || { id: 'TBD', name: 'TBD', flag: '' },
        away: m.a() || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore || '',
        awayScore: saved.awayScore || '',
      };
    });
  }, [standings, thirdPlaceStandings, playoffScores]);

  // Round of 16 Tree Definition
  const liveR16 = useMemo(() => {
    const layout = [
      { id: 'R16_1', p: ['R32_1', 'R32_2'] }, { id: 'R16_2', p: ['R32_3', 'R32_4'] },
      { id: 'R16_3', p: ['R32_5', 'R32_6'] }, { id: 'R16_4', p: ['R32_7', 'R32_8'] },
      { id: 'R16_5', p: ['R32_9', 'R32_10'] }, { id: 'R16_6', p: ['R32_11', 'R32_12'] },
      { id: 'R16_7', p: ['R32_13', 'R32_14'] }, { id: 'R16_8', p: ['R32_15', 'R32_16'] }
    ];
    return layout.map(m => {
      const saved = playoffScores[m.id] || {};
      return {
        id: m.id,
        home: getWinnerOfMatch(m.p[0]) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getWinnerOfMatch(m.p[1]) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore || '',
        awayScore: saved.awayScore || ''
      };
    });
  }, [liveR32, playoffScores]);

  const getR16Winner = (id) => {
    const match = liveR16.find(m => m.id === id);
    return getWinnerOfStage(id, [match?.home, match?.away], () => match?.home);
  };

  // Quarterfinals Tree Definition
  const liveQF = useMemo(() => {
    const layout = [
      { id: 'QF_1', p: ['R16_1', 'R16_2'] }, { id: 'QF_2', p: ['R16_3', 'R16_4'] },
      { id: 'QF_3', p: ['R16_5', 'R16_6'] }, { id: 'QF_4', p: ['R16_7', 'R16_8'] }
    ];
    return layout.map(m => {
      const saved = playoffScores[m.id] || {};
      return {
        id: m.id,
        home: liveR16.find(r => r.id === m.p[0])?.homeScore && getR16Winner(m.p[0]) || { id: 'TBD', name: 'TBD', flag: '' },
        away: liveR16.find(r => r.id === m.p[1])?.homeScore && getR16Winner(m.p[1]) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore || '',
        awayScore: saved.awayScore || ''
      };
    });
  }, [liveR16, playoffScores]);

  const getQFWinner = (id) => {
    const match = liveQF.find(m => m.id === id);
    if (!match) return null;
    const s1 = parseInt(match.homeScore, 10);
    const s2 = parseInt(match.awayScore, 10);
    if (isNaN(s1) || isNaN(s2)) return null;
    return s1 > s2 ? match.home : match.away;
  };

  // Semifinals Tree Definition
  const liveSF = useMemo(() => {
    const layout = [
      { id: 'SF_1', p: ['QF_1', 'QF_2'] },
      { id: 'SF_2', p: ['QF_3', 'QF_4'] }
    ];
    return layout.map(m => {
      const saved = playoffScores[m.id] || {};
      return {
        id: m.id,
        home: getQFWinner(m.p[0]) || { id: 'TBD', name: 'TBD', flag: '' },
        away: getQFWinner(m.p[1]) || { id: 'TBD', name: 'TBD', flag: '' },
        homeScore: saved.homeScore || '',
        awayScore: saved.awayScore || ''
      };
    });
  }, [liveQF, playoffScores]);

  const getSFWinner = (id) => {
    const match = liveSF.find(m => m.id === id);
    if (!match) return null;
    const s1 = parseInt(match.homeScore, 10);
    const s2 = parseInt(match.awayScore, 10);
    if (isNaN(s1) || isNaN(s2)) return null;
    return s1 > s2 ? match.home : match.away;
  };

  // Final Match Definition
  const liveFinal = useMemo(() => {
    const saved = playoffScores['FINAL'] || {};
    return [{
      id: 'FINAL',
      home: getSFWinner('SF_1') || { id: 'TBD', name: 'TBD', flag: '' },
      away: getSFWinner('SF_2') || { id: 'TBD', name: 'TBD', flag: '' },
      homeScore: saved.homeScore || '',
      awayScore: saved.awayScore || ''
    }];
  }, [liveSF, playoffScores]);

  // -------------------------
  // UI VISUAL COMPONENTS
  // -------------------------
  const TeamRow = ({ team }) => {
    const isTBD = !team || team.id === 'TBD';
    return (
      <div className="flex items-center gap-2.5 w-full justify-start">
        {isTBD ? (
          <div className="w-5 h-[14px] bg-white/5 border border-white/10 rounded-sm shrink-0" />
        ) : (
          <img
            src={`https://flagcdn.com/20x15/${team.flag?.toLowerCase()}.png`}
            alt={team.name || team.id}
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

  // -------------------------
  // RENDER GRID
  // -------------------------
  const leftR32 = liveR32.slice(0, 8);
  const rightR32 = liveR32.slice(8);

  return (
    <div className="w-full overflow-x-auto bg-[#02040a] p-8 select-none">
      <div className="min-w-[1500px] grid grid-cols-9 gap-4 items-stretch content-center min-h-[720px]">
        
        {/* LEFT PATH */}
        <Column title="Round of 32" data={leftR32} className="space-y-4" />
        <Column title="Round of 16" data={liveR16.slice(0, 4)} className="space-y-16" />
        <Column title="Quarterfinals" data={liveQF.slice(0, 2)} className="space-y-40" />
        <Column title="Semifinal" data={[liveSF[0]]} className="space-y-0" />

        {/* CENTRAL NODE */}
        <div className="flex flex-col justify-center items-center px-2">
          <div className="text-center text-[11px] tracking-widest text-yellow-400 font-black mb-4 uppercase border-b border-yellow-500/20 pb-1 w-full">
            🏆 WORLD CUP FINAL
          </div>
          <div className="w-full transform scale-110 shadow-2xl">
            <MatchCard match={liveFinal[0]} />
          </div>
        </div>

        {/* RIGHT PATH */}
        <Column title="Semifinal" data={[liveSF[1]]} className="space-y-0" />
        <Column title="Quarterfinals" data={liveQF.slice(2, 4)} className="space-y-40" />
        <Column title="Round of 16" data={liveR16.slice(4, 8)} className="space-y-16" />
        <Column title="Round of 32" data={rightR32} className="space-y-4" />

      </div>
    </div>
  );
}