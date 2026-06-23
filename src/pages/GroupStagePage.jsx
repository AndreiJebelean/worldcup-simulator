import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { generateAllMatches, calculateStandings, calculateThirdPlace } from '../utils/matchHelpers';

import GroupTables from '../components/GroupTables';
import WildcardTable from '../components/WildcardTable';
import MatchFixtures from '../components/MatchFixtures';

import logoTrophy from '../assets/cup.png';

export default function GroupStagePage() {
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [isEditing, setIsEditing] = useState(true);

  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('wc2026_group_matches');
    return saved ? JSON.parse(saved) : generateAllMatches();
  });

  useEffect(() => {
    localStorage.setItem(
      'wc2026_group_matches',
      JSON.stringify(matches)
    );
  }, [matches]);

  const handleScoreChange = (matchId, field, value) => {
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? { ...m, [field]: value }
          : m
      )
    );
  };

  const currentStandings = calculateStandings(matches);
  const thirdPlaceStandings = calculateThirdPlace(currentStandings);

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100">

      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#040814]/60 border-b border-white/[0.06] px-8 py-3.5 flex justify-between items-center">

        <div className="flex items-center gap-4">
          <img
            src={logoTrophy}
            alt="World Cup"
            className="h-14"
          />

          <div>
            <h1 className="text-2xl font-black">
              WORLD CUP 2026 SIMULATOR
            </h1>
            <p className="text-xs text-emerald-400">
              12 Groups Format
            </p>
          </div>
        </div>

        <div className="flex gap-3">

          <Link
            to="/playoffs"
            className="px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
          >
            🏆 PLAYOFFS
          </Link>

          <button
            onClick={() => setTimezone('Europe/Berlin')}
            className="px-4 py-2 border rounded-xl"
          >
            BERLIN
          </button>

          <button
            onClick={() => setTimezone('Europe/Bucharest')}
            className="px-4 py-2 border rounded-xl"
          >
            BUCHAREST
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 border rounded-xl"
          >
            {isEditing ? 'SAVE & VIEW' : 'EDIT'}
          </button>

        </div>
      </header>

      <main className="w-full p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">

        <div className="xl:col-span-9 flex flex-col gap-6">
          <GroupTables standings={currentStandings} />

          <div className="backdrop-blur-md bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5">
            <WildcardTable thirdPlaceStandings={thirdPlaceStandings} />
          </div>
        </div>

        <div className="xl:col-span-3 xl:sticky xl:top-28">

          <div className="backdrop-blur-xl bg-[#060b18]/40 border border-white/[0.06] rounded-2xl p-5">

            <MatchFixtures
              matches={matches}
              isEditing={isEditing}
              timezone={timezone}
              onScoreChange={handleScoreChange}
            />

          </div>

        </div>

      </main>

    </div>
  );
}