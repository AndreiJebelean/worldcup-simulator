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
  // HELPERS
  // -------------------------
  const getTeamFromStandings = (groupLetter, index) => {
    const team = standings?.[`Group ${groupLetter}`]?.[index];
    if (!team) return null;
    return { id: team.id, name: team.name, flag: team.flag };
  };

  const getThird = (index) => {
    const team = thirdPlaceStandings?.[index];
    if (!team) return null;
    return { id: team.id, name: team.name, flag: team.flag };
  };

  const getWinner = (match) => {
    if (!match?.home || !match?.away) return null;
    const s1 = parseInt(match.homeScore, 10);
    const s2 = parseInt(match.awayScore, 10);

    if (isNaN(s1) || isNaN(s2)) return null;
    if (s1 > s2) return match.home;
    if (s2 > s1) return match.away;
    return null;
  };

  const buildMatch = (id, home, away) => {
    const saved = playoffScores[id] || {};
    return {
      id,
      home: home || { id: 'TBD', flag: '' },
      away: away || { id: 'TBD', flag: '' },
      homeScore: saved.homeScore || '',
      awayScore: saved.awayScore || ''
    };
  };

  // -------------------------
  // MATCH DATA DEFINITIONS
  // -------------------------
  const R32 = useMemo(() => {
    const layout = [
      [getTeamFromStandings('A', 1), getTeamFromStandings('B', 1)], // Left Side
      [getTeamFromStandings('C', 0), getTeamFromStandings('F', 1)],
      [{ id: 'GER', flag: 'de' }, getThird(0)],
      [getTeamFromStandings('F', 0), getTeamFromStandings('C', 1)],
      [getTeamFromStandings('E', 1), getTeamFromStandings('I', 1)],
      [getTeamFromStandings('I', 0), getThird(1)],
      [{ id: 'MEX', flag: 'mx' }, getThird(2)],
      [getTeamFromStandings('L', 0), getThird(3)],

      [getTeamFromStandings('G', 0), getThird(4)],                 // Right Side
      [{ id: 'USA', flag: 'us' }, getThird(5)],
      [getTeamFromStandings('H', 0), getTeamFromStandings('J', 1)],
      [getTeamFromStandings('K', 1), getTeamFromStandings('L', 1)],
      [getTeamFromStandings('B', 0), getThird(6)],
      [getTeamFromStandings('D', 1), getTeamFromStandings('G', 1)],
      [{ id: 'ARG', flag: 'ar' }, getTeamFromStandings('H', 1)],
      [getTeamFromStandings('K', 0), getThird(7)],
    ];
    return layout.map((m, i) => buildMatch(`R32_${i + 1}`, m[0], m[1]));
  }, [standings, thirdPlaceStandings, playoffScores]);

  const getR32Winner = (i) => getWinner(R32[i]);

  const R16 = useMemo(() => {
    const pairs = [
      [0, 1], [2, 3], [4, 5], [6, 7], // Left Side Matches
      [8, 9], [10, 11], [12, 13], [14, 15] // Right Side Matches
    ];
    return pairs.map((p, i) => buildMatch(`R16_${i + 1}`, getR32Winner(p[0]), getR32Winner(p[1])));
  }, [R32]);

  const getR16Winner = (i) => getWinner(R16[i]);

  const QF = useMemo(() => {
    const pairs = [
      [0, 1], [2, 3], // Left Side
      [4, 5], [6, 7]  // Right Side
    ];
    return pairs.map((p, i) => buildMatch(`QF_${i + 1}`, getR16Winner(p[0]), getR16Winner(p[1])));
  }, [R16]);

  const getQFWinner = (i) => getWinner(QF[i]);

  const SF = useMemo(() => {
    return [
      buildMatch('SF_1', getQFWinner(0), getQFWinner(1)), // Left Side Winner
      buildMatch('SF_2', getQFWinner(2), getQFWinner(3)), // Right Side Winner
    ];
  }, [QF]);

  const FINAL = useMemo(() => {
    return [
      buildMatch('FINAL', getWinner(SF[0]), getWinner(SF[1]))
    ];
  }, [SF]);

  // -------------------------
  // COMPONENTS
  // -------------------------
  const TeamRow = ({ team, isHome, matchId }) => {
    const isTBD = !team || team.id === 'TBD';
    return (
      <div className={`flex items-center gap-2.5 w-full ${isHome ? 'justify-start' : 'justify-start'}`}>
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
          <TeamRow team={match.home} isHome={true} matchId={match.id} />
          <input
            className="w-9 h-7 text-center text-xs bg-black/40 border border-white/5 rounded-md text-green-400 font-mono font-bold focus:outline-none focus:border-cyan-500/50"
            value={match.homeScore}
            onChange={e => updateScore(match.id, 'homeScore', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <TeamRow team={match.away} isHome={false} matchId={match.id} />
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
      <div className="min-w-[1400px] grid grid-cols-9 gap-4 items-stretch items-center content-center min-h-[720px]">
        
        {/* LEFT SIDE BRACKET PATHWAY */}
        <Column title="Round of 32" data={R32.slice(0, 8)} className="space-y-4" />
        <Column title="Round of 16" data={R16.slice(0, 4)} className="space-y-16" />
        <Column title="Quarterfinals" data={QF.slice(0, 2)} className="space-y-40" />
        <Column title="Semifinal" data={[SF[0]]} className="space-y-0" />

        {/* CENTRAL FINAL TROPHY NODE */}
        <div className="flex flex-col justify-center items-center px-2">
          <div className="text-center text-[11px] tracking-widest text-yellow-400 font-black mb-4 uppercase border-b border-yellow-500/20 pb-1 w-full">
            🏆 WORLD CUP FINAL
          </div>
          <div className="w-full transform scale-110 shadow-2xl">
            <MatchCard match={FINAL[0]} />
          </div>
        </div>

        {/* RIGHT SIDE BRACKET PATHWAY */}
        <Column title="Semifinal" data={[SF[1]]} className="space-y-0" />
        <Column title="Quarterfinals" data={QF.slice(2, 4)} className="space-y-40" />
        <Column title="Round of 16" data={R16.slice(4, 8)} className="space-y-16" />
        <Column title="Round of 32" data={R32.slice(8, 16)} className="space-y-4" />

      </div>
    </div>
  );
}