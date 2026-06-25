import React, { useState, useEffect, useMemo } from 'react';
import { getWinner, getLoser } from '../utils/playoffHelpers';

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

  // -------------------------
  // R32 STRUCTURE
  // -------------------------
  const liveR32 = useMemo(() => {
    const layout = [
      { id: 'R32_1', h: () => getTeamFromStandings('A',1), a: () => getTeamFromStandings('B',1) },
      { id: 'R32_2', h: () => getTeamFromStandings('C',0), a: () => getTeamFromStandings('F',1) },

      { id: 'R32_3', h: () => ({ id:'GER', name:'GER', flag:'de' }), a: () => getThird(0) },

      { id: 'R32_4', h: () => getTeamFromStandings('F',0), a: () => getTeamFromStandings('C',1) },
      { id: 'R32_5', h: () => getTeamFromStandings('E',1), a: () => getTeamFromStandings('I',1) },

      { id: 'R32_6', h: () => getTeamFromStandings('I',0), a: () => getThird(1) },
      { id: 'R32_7', h: () => ({ id:'MEX', name:'MEX', flag:'mx' }), a: () => getThird(2) },
      { id: 'R32_8', h: () => getTeamFromStandings('L',0), a: () => getThird(3) },
      { id: 'R32_9', h: () => getTeamFromStandings('G',0), a: () => getThird(4) },
      { id: 'R32_10', h: () => ({ id:'USA', name:'USA', flag:'us' }), a: () => getThird(5) },

      { id: 'R32_11', h: () => getTeamFromStandings('H',0), a: () => getTeamFromStandings('J',1) },
      { id: 'R32_12', h: () => getTeamFromStandings('K',1), a: () => getTeamFromStandings('L',1) },

      { id: 'R32_13', h: () => getTeamFromStandings('B',0), a: () => getThird(6) },

      { id: 'R32_14', h: () => getTeamFromStandings('D',1), a: () => getTeamFromStandings('G',1) },
      { id: 'R32_15', h: () => ({ id:'ARG', name:'ARG', flag:'ar' }), a: () => getTeamFromStandings('H',1) },

      { id: 'R32_16', h: () => getTeamFromStandings('K',0), a: () => getThird(7) },
    ];

    return layout.map(m => {
      const saved = playoffScores[m.id] || {};
      return {
        id: m.id,
        home: m.h() || { id:'TBD', name:'TBD', flag:'' },
        away: m.a() || { id:'TBD', name:'TBD', flag:'' },
        homeScore: saved.homeScore || '',
        awayScore: saved.awayScore || '',
        homePen: saved.homePen || '',
        awayPen: saved.awayPen || '',
      };
    });
  }, [standings, thirdPlaceStandings, playoffScores]);

  // -------------------------
  // UI MATCH CARD (GLASS FIFA STYLE)
  // -------------------------
  const Match = ({ match }) => {
    const draw = match.homeScore !== '' && match.awayScore !== '' &&
      parseInt(match.homeScore) === parseInt(match.awayScore);

    return (
      <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3 hover:border-cyan-400/30 transition">

        {/* HOME */}
        <div className="flex items-center gap-2 w-[40%] justify-end">
          <span className="text-[11px] font-bold text-slate-200">
            {match.home?.id}
          </span>
          {match.home?.flag && (
            <img
              src={`https://flagcdn.com/20x15/${match.home.flag.toLowerCase()}.png`}
              className="w-5 h-[14px] rounded-sm border border-black/40"
            />
          )}
        </div>

        {/* SCORE */}
        <div className="flex items-center gap-1">
          <input
            className="w-8 h-8 text-center bg-black/40 border border-white/10 rounded text-white"
            value={match.homeScore}
            onChange={e => updateScore(match.id,'homeScore',e.target.value)}
          />
          <span className="text-gray-500">-</span>
          <input
            className="w-8 h-8 text-center bg-black/40 border border-white/10 rounded text-white"
            value={match.awayScore}
            onChange={e => updateScore(match.id,'awayScore',e.target.value)}
          />
        </div>

        {/* AWAY */}
        <div className="flex items-center gap-2 w-[40%]">
          {match.away?.flag && (
            <img
              src={`https://flagcdn.com/20x15/${match.away.flag.toLowerCase()}.png`}
              className="w-5 h-[14px] rounded-sm border border-black/40"
            />
          )}
          <span className="text-[11px] font-bold text-slate-200">
            {match.away?.id}
          </span>
        </div>

      </div>
    );
  };

  // -------------------------
  // SPLIT
  // -------------------------
  const left = liveR32.slice(0,8);
  const right = liveR32.slice(8);

  return (
    <div className="w-full overflow-x-auto bg-[#05070d] p-6">
      <div className="min-w-[1700px] grid grid-cols-7 gap-6">

        <div className="space-y-3">
          {left.map(m => <Match key={m.id} match={m} />)}
        </div>

        <div />

        <div />

        <div className="flex flex-col justify-center gap-4">
          <div className="text-center text-xs text-purple-300 font-bold">R32</div>
        </div>

        <div />

        <div />

        <div className="space-y-3">
          {right.map(m => <Match key={m.id} match={m} />)}
        </div>

      </div>
    </div>
  );
}