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
  // THIRD PLACE RANKING (GLOBAL TOP 8)
  // -----------------------------
  const rankedThirds = useMemo(() => {
    if (!thirdPlaceStandings) return [];
    return [...thirdPlaceStandings].slice(0, 8);
  }, [thirdPlaceStandings]);

  const thirdGroups = useMemo(() => {
    return rankedThirds.map(t => t.originGroup).sort().join('');
  }, [rankedThirds]);

  /**
   * FIFA-style mapping placeholder
   * (this is the CRITICAL missing logic in most apps)
   */
  const THIRD_PLACE_MAP = {
    // You MUST extend this if you want full FIFA accuracy
    "ABCDEFGH": {
      GER: "A",
      MEX: "C",
      USA: "B",
      SLOT_3: "D",
      SLOT_4: "F",
      SLOT_5: "G",
      SLOT_6: "H",
      SLOT_7: "E"
    }
  };

  const assignment = THIRD_PLACE_MAP[thirdGroups] || null;

  const getThirdPlaceTeam = (slot) => {
    if (!assignment) return null;

    const group = assignment[slot];
    if (!group) return null;

    return rankedThirds.find(t => t.originGroup === group) || null;
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

      const home = m.home() || { id: 'TBD', name: 'TBD' };
      const away = m.away() || { id: 'TBD', name: 'TBD' };

      return {
        id: m.id,
        home,
        away,
        homeScore: saved.homeScore ?? '',
        awayScore: saved.awayScore ?? '',
        homePen: saved.homePen ?? '',
        awayPen: saved.awayPen ?? ''
      };
    });
  }, [standings, rankedThirds, thirdGroups, playoffScores]);

  // -----------------------------
  // MATCH COMPONENT
  // -----------------------------
  const RenderMatchCard = ({ match }) => {
    const showPens =
      match.homeScore !== '' &&
      match.awayScore !== '' &&
      parseInt(match.homeScore) === parseInt(match.awayScore);

    return (
      <div className="bg-[#0b111e] border border-white/[0.04] rounded-lg p-3 text-xs flex justify-between items-center">
        <div className="w-[40%] text-right font-mono">
          {match.home?.name || 'TBD'}
        </div>

        <div className="flex gap-1 items-center">
          <input
            value={match.homeScore}
            onChange={(e) => updateScore(match.id, 'homeScore', e.target.value)}
            className="w-8 text-center bg-black"
          />
          <span>-</span>
          <input
            value={match.awayScore}
            onChange={(e) => updateScore(match.id, 'awayScore', e.target.value)}
            className="w-8 text-center bg-black"
          />
        </div>

        <div className="w-[40%] text-left font-mono">
          {match.away?.name || 'TBD'}
        </div>
      </div>
    );
  };

  // -----------------------------
  // SPLIT BRACKET
  // -----------------------------
  const leftR32 = liveR32Matches.slice(0, 8);
  const rightR32 = liveR32Matches.slice(8);

  return (
    <div className="w-full overflow-x-auto bg-black text-white">
      <div className="min-w-[1600px] grid grid-cols-7 gap-6 p-6">

        <div>
          {leftR32.map(m => (
            <RenderMatchCard key={m.id} match={m} />
          ))}
        </div>

        <div />

        <div />

        <div>
          <RenderMatchCard match={liveR32Matches[2]} />
        </div>

        <div />

        <div />

        <div>
          {rightR32.map(m => (
            <RenderMatchCard key={m.id} match={m} />
          ))}
        </div>

      </div>
    </div>
  );
}