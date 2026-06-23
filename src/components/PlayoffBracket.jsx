import React, { useState, useEffect } from 'react';
import { getWinner, getLoser } from '../utils/playoffHelpers';

export default function PlayoffBracket({ standings = {}, thirdPlaceStandings = [] }) {
  // Store user-entered scores/pens for the playoff rounds here
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

  // 1. HELPERS TO LOOK UP ACTUAL LIVE NATIONS FROM THE GROUP RESULTS
  const getTeamFromStandings = (groupLetter, rankIndex) => {
    // FIX: standings keys are formatted as "Group A", "Group B" etc.
    const groupKey = `Group ${groupLetter}`;
    const groupTeams = standings[groupKey];
    if (groupTeams && groupTeams[rankIndex]) {
      const team = groupTeams[rankIndex];
      return {
        id: team.id || team.code || team.name.substring(0, 3),
        name: team.name,
        code: team.code || team.id,
        flag: team.flag || team.code
      };
    }
    return null;
  };

  const getThirdPlaceTeam = (rankIndex) => {
    if (thirdPlaceStandings && thirdPlaceStandings[rankIndex]) {
      const team = thirdPlaceStandings[rankIndex];
      return {
        id: team.id || team.code || team.name.substring(0, 3),
        name: team.name,
        code: team.code || team.id,
        flag: team.flag || team.code
      };
    }
    return null;
  };

  // 2. DYNAMIC MAPPING FOR ROUND OF 32 SEEDING SETUP
  const liveR32Matches = React.useMemo(() => {
    const baseR32Layout = [
      { id: 'R32_1', homeLookup: () => getTeamFromStandings('A', 1), awayLookup: () => getTeamFromStandings('B', 1) }, // A2 vs B2
      { id: 'R32_2', homeLookup: () => getTeamFromStandings('C', 0), awayLookup: () => getTeamFromStandings('F', 1) }, // C1 vs F2
      { id: 'R32_3', homeLookup: () => ({ id: 'GER', name: 'Germany', flag: 'de' }), awayLookup: () => getThirdPlaceTeam(0) }, // Germany vs 3rd Place
      { id: 'R32_4', homeLookup: () => getTeamFromStandings('F', 0), awayLookup: () => getTeamFromStandings('C', 1) }, // F1 vs C2
      { id: 'R32_5', homeLookup: () => getTeamFromStandings('E', 1), awayLookup: () => getTeamFromStandings('I', 1) }, // E2 vs I2
      { id: 'R32_6', homeLookup: () => getTeamFromStandings('I', 0), awayLookup: () => getThirdPlaceTeam(1) }, // I1 vs 3rd Place
      { id: 'R32_7', homeLookup: () => ({ id: 'MEX', name: 'Mexico', flag: 'mx' }), awayLookup: () => getThirdPlaceTeam(2) }, // Mexico vs 3rd Place
      { id: 'R32_8', homeLookup: () => getTeamFromStandings('L', 0), awayLookup: () => getThirdPlaceTeam(3) }, // L1 vs 3rd Place
      { id: 'R32_9', homeLookup: () => getTeamFromStandings('G', 0), awayLookup: () => getThirdPlaceTeam(4) }, // G1 vs 3rd Place
      { id: 'R32_10', homeLookup: () => ({ id: 'USA', name: 'United States', flag: 'us' }), awayLookup: () => getThirdPlaceTeam(5) }, // USA vs 3rd Place
      { id: 'R32_11', homeLookup: () => getTeamFromStandings('H', 0), awayLookup: () => getTeamFromStandings('J', 1) }, // H1 vs J2
      { id: 'R32_12', homeLookup: () => getTeamFromStandings('K', 1), awayLookup: () => getTeamFromStandings('L', 1) }, // K2 vs L2
      { id: 'R32_13', homeLookup: () => getTeamFromStandings('B', 0), awayLookup: () => getThirdPlaceTeam(6) }, // B1 vs 3rd Place
      { id: 'R32_14', homeLookup: () => getTeamFromStandings('D', 1), awayLookup: () => getTeamFromStandings('G', 1) }, // D2 vs G2
      { id: 'R32_15', homeLookup: () => ({ id: 'ARG', name: 'Argentina', flag: 'ar' }), awayLookup: () => getTeamFromStandings('H', 1) }, // Argentina vs H2
      { id: 'R32_16', homeLookup: () => getTeamFromStandings('K', 0), awayLookup: () => getThirdPlaceTeam(7) }, // K1 vs 3rd Place
    ];

    return baseR32Layout.map(m => {
      const savedScores = playoffScores[m.id] || {};
      const homeTeam = m.homeLookup();
      const awayTeam = m.awayLookup();

      return {
        id: m.id,
        home: homeTeam || { id: 'TBD', name: 'TBD', code: 'TBD', flag: null },
        away: awayTeam || { id: 'TBD', name: 'TBD', code: 'TBD', flag: null },
        homeScore: savedScores.homeScore ?? '',
        awayScore: savedScores.awayScore ?? '',
        homePen: savedScores.homePen ?? '',
        awayPen: savedScores.awayPen ?? '',
      };
    });
  }, [standings, thirdPlaceStandings, playoffScores]);

  // 3. PROPAGATION DOWNSTREAM
  const buildDownstreamMatch = (id, homeMatchDependency, awayMatchDependency, isThirdPlace = false) => {
    const savedScores = playoffScores[id] || {};
    const homeTeam = !isThirdPlace ? getWinner(homeMatchDependency) : getLoser(homeMatchDependency);
    const awayTeam = !isThirdPlace ? getWinner(awayMatchDependency) : getLoser(awayMatchDependency);

    return {
      id,
      home: homeTeam || { id: 'TBD', name: 'TBD', code: 'TBD', flag: null },
      away: awayTeam || { id: 'TBD', name: 'TBD', code: 'TBD', flag: null },
      homeScore: savedScores.homeScore ?? '',
      awayScore: savedScores.awayScore ?? '',
      homePen: savedScores.homePen ?? '',
      awayPen: savedScores.awayPen ?? '',
    };
  };

  const leftR32 = liveR32Matches.slice(0, 8);
  const rightR32 = liveR32Matches.slice(8, 16);

  const leftR16 = [
    buildDownstreamMatch('R16_1', leftR32[0], leftR32[1]),
    buildDownstreamMatch('R16_2', leftR32[2], leftR32[3]),
    buildDownstreamMatch('R16_3', leftR32[4], leftR32[5]),
    buildDownstreamMatch('R16_4', leftR32[6], leftR32[7]),
  ];

  const leftQF = [
    buildDownstreamMatch('QF_1', leftR16[0], leftR16[1]),
    buildDownstreamMatch('QF_2', leftR16[2], leftR16[3]),
  ];

  const leftSF = buildDownstreamMatch('SF_1', leftQF[0], leftQF[1]);

  const rightR16 = [
    buildDownstreamMatch('R16_5', rightR32[0], rightR32[1]),
    buildDownstreamMatch('R16_6', rightR32[2], rightR32[3]),
    buildDownstreamMatch('R16_7', rightR32[4], rightR32[5]),
    buildDownstreamMatch('R16_8', rightR32[6], rightR32[7]),
  ];

  const rightQF = [
    buildDownstreamMatch('QF_3', rightR16[0], rightR16[1]),
    buildDownstreamMatch('QF_4', rightR16[2], rightR16[3]),
  ];

  const rightSF = buildDownstreamMatch('SF_2', rightQF[0], rightQF[1]);

  const finalMatch = buildDownstreamMatch('FINAL', leftSF, rightSF);
  const thirdPlaceMatch = buildDownstreamMatch('THIRD_PLACE', leftSF, rightSF, true);

  const RenderMatchCard = ({ match }) => {
    const isTbdHome = !match.home || match.home.name === 'TBD';
    const isTbdAway = !match.away || match.away.name === 'TBD';
    const showPens = match.homeScore !== '' && match.awayScore !== '' && (parseInt(match.homeScore, 10) === parseInt(match.awayScore, 10));

    const homeCode = (match.home?.id || 'TBD').toUpperCase();
    const awayCode = (match.away?.id || 'TBD').toUpperCase();

    return (
      <div className="bg-[#0b111e] border border-white/[0.04] rounded-lg p-3.5 text-xs w-full flex flex-col items-center justify-center shadow-md">
        <div className="w-full flex items-center justify-between gap-1">
          
          <div className={`flex items-center justify-end gap-2 w-[40%] text-right ${isTbdHome ? 'opacity-25' : ''}`}>
            <span className="font-mono font-bold text-slate-100 tracking-wider text-[11px] truncate">
              {homeCode}
            </span>
            {match.home?.flag && (
              <img
                src={`https://flagcdn.com/20x15/${match.home.flag.toLowerCase()}.png`}
                className="rounded-sm object-cover border border-gray-800 w-5 h-[14px] shrink-0"
                alt=""
                onError={(e) => { e.target.src = 'https://flagcdn.com/20x15/un.png'; }}
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-1 shrink-0 mx-auto">
            {showPens && (
              <input
                type="number"
                placeholder="P"
                value={match.homePen}
                onChange={(e) => updateScore(match.id, 'homePen', e.target.value)}
                className="w-5 h-8 text-center bg-[#060a12] border border-amber-500/20 text-amber-400 rounded font-mono text-[10px] focus:outline-none"
              />
            )}
            
            <input
              type="number"
              min="0"
              value={match.homeScore}
              onChange={(e) => updateScore(match.id, 'homeScore', e.target.value)}
              className="w-9 h-9 text-center bg-[#070b14] border border-white/[0.08] text-white rounded font-mono font-bold text-sm focus:outline-none focus:border-cyan-600 transition-all"
            />
            
            <span className="text-slate-600 font-medium px-0.5 text-xs select-none">-</span>
            
            <input
              type="number"
              min="0"
              value={match.awayScore}
              onChange={(e) => updateScore(match.id, 'awayScore', e.target.value)}
              className="w-9 h-9 text-center bg-[#070b14] border border-white/[0.08] text-white rounded font-mono font-bold text-sm focus:outline-none focus:border-cyan-600 transition-all"
            />

            {showPens && (
              <input
                type="number"
                placeholder="P"
                value={match.awayPen}
                onChange={(e) => updateScore(match.id, 'awayPen', e.target.value)}
                className="w-5 h-8 text-center bg-[#060a12] border border-amber-500/20 text-amber-400 rounded font-mono text-[10px] focus:outline-none"
              />
            )}
          </div>

          <div className={`flex items-center justify-start gap-2 w-[40%] text-left ${isTbdAway ? 'opacity-25' : ''}`}>
            {match.away?.flag && (
              <img
                src={`https://flagcdn.com/20x15/${match.away.flag.toLowerCase()}.png`}
                className="rounded-sm object-cover border border-gray-800 w-5 h-[14px] shrink-0"
                alt=""
                onError={(e) => { e.target.src = 'https://flagcdn.com/20x15/un.png'; }}
              />
            )}
            <span className="font-mono font-bold text-slate-100 tracking-wider text-[11px] truncate">
              {awayCode}
            </span>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-10 custom-scrollbar bg-[#02050b]">
      <div className="min-w-[1750px] grid grid-cols-7 gap-6 items-center px-6 py-6">
        
        <div className="flex flex-col gap-4">
          <div className="text-center font-bold tracking-wider text-slate-500 text-[10px] uppercase pb-2 border-b border-white/[0.04] mb-1">ROUND OF 32</div>
          {leftR32.map(m => <RenderMatchCard key={m.id} match={m} />)}
        </div>

        <div className="flex flex-col gap-28 justify-around h-full py-8">
          <div className="text-center font-bold tracking-wider text-cyan-500/90 text-[10px] uppercase pb-2 border-b border-cyan-500/10 mb-1">ROUND OF 16</div>
          {leftR16.map(m => <RenderMatchCard key={m.id} match={m} />)}
        </div>

        <div className="flex flex-col gap-[28rem] justify-around h-full py-16">
          <div className="text-center font-bold tracking-wider text-indigo-400 text-[10px] uppercase pb-2 border-b border-indigo-500/10 mb-1">QUARTER-FINALS</div>
          {leftQF.map(m => <RenderMatchCard key={m.id} match={m} />)}
        </div>

        <div className="flex flex-col justify-between h-full py-8 px-4 bg-[#050912]/40 border border-white/[0.02] rounded-xl min-h-[820px] shadow-2xl">
          <div className="grid grid-cols-2 gap-4 items-start w-full">
            <div>
              <div className="text-center font-bold text-purple-400/90 text-[9px] tracking-wider mb-2 uppercase">SEMIFINAL A</div>
              <RenderMatchCard match={leftSF} />
            </div>
            <div>
              <div className="text-center font-bold text-purple-400/90 text-[9px] tracking-wider mb-2 uppercase">SEMIFINAL B</div>
              <RenderMatchCard match={rightSF} />
            </div>
          </div>

          <div className="my-auto py-8 flex flex-col items-center justify-center scale-105">
            <div className="text-center font-black tracking-[0.2em] text-amber-400 text-[11px] mb-3 uppercase">
              🏆 STAGE // GRAND FINAL
            </div>
            <div className="w-full max-w-[260px]">
              <RenderMatchCard match={finalMatch} />
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-5 w-full max-w-[240px] mx-auto">
            <div className="text-center font-bold tracking-widest text-slate-400 text-[9px] mb-2 uppercase">STAGE // 3RD PLACE PLAYOFF</div>
            <RenderMatchCard match={thirdPlaceMatch} />
          </div>
        </div>

        <div className="flex flex-col gap-[28rem] justify-around h-full py-16">
          <div className="text-center font-bold tracking-wider text-indigo-400 text-[10px] uppercase pb-2 border-b border-indigo-500/10 mb-1">QUARTER-FINALS</div>
          {rightQF.map(m => <RenderMatchCard key={m.id} match={m} />)}
        </div>

        <div className="flex flex-col gap-28 justify-around h-full py-8">
          <div className="text-center font-bold tracking-wider text-cyan-500/90 text-[10px] uppercase pb-2 border-b border-cyan-500/10 mb-1">ROUND OF 16</div>
          {rightR16.map(m => <RenderMatchCard key={m.id} match={m} />)}
        </div>

        <div className="flex flex-col gap-4">
          <div className="text-center font-bold tracking-wider text-slate-500 text-[10px] uppercase pb-2 border-b border-white/[0.04] mb-1">ROUND OF 32</div>
          {rightR32.map(m => <RenderMatchCard key={m.id} match={m} />)}
        </div>

      </div>
    </div>
  );
}