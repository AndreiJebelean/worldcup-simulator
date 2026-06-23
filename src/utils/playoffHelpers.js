// src/utils/playoffHelpers.js

export function generatePlayoffBracket(standings, thirdPlaceStandings) {
  // Helper to extract safe team values from standings array
  const getTeam = (group, index) => {
    if (standings && standings[group] && standings[group][index]) {
      return standings[group][index];
    }
    // Fallback placeholder if data hasn't processed yet
    return { id: `${group}${index + 1}`, name: `Group ${group} ${index === 0 ? 'Winner' : 'Runner-up'}`, flag: '🏳️' };
  };

  // Safe fallback array for third place wildcards
  const thirds = thirdPlaceStandings || [];
  const getThird = (index, label) => thirds[index] || { id: `3RD_${index}`, name: label, flag: '🏳️' };

  // Mapping precisely to the schedule criteria provided by the user
  const initialR32 = [
    { id: 'R32_1', name: 'Match 1', date: 'June 28', label: 'Group A runner-up vs Group B runner-up', home: getTeam('A', 1), away: getTeam('B', 1) },
    { id: 'R32_2', name: 'Match 2', date: 'June 29', label: 'Group C winner vs Group F runner-up', home: getTeam('C', 0), away: getTeam('F', 1) },
    { id: 'R32_3', name: 'Match 3', date: 'June 29', label: 'Germany vs 3rd A/B/C/D/F', home: { id: 'GER', name: 'Germany', flag: '🇩🇪' }, away: getThird(0, '3rd Place A/B/C/D/F') },
    { id: 'R32_4', name: 'Match 4', date: 'June 29', label: 'Group F winner vs Group C runner-up', home: getTeam('F', 0), away: getTeam('C', 1) },
    { id: 'R32_5', name: 'Match 5', date: 'June 30', label: 'Group E runner-up vs Group I runner-up', home: getTeam('E', 1), away: getTeam('I', 1) },
    { id: 'R32_6', name: 'Match 6', date: 'June 30', label: 'Group I winner vs 3rd C/D/F/G/H', home: getTeam('I', 0), away: getThird(1, '3rd Place C/D/F/G/H') },
    { id: 'R32_7', name: 'Match 7', date: 'June 30', label: 'Mexico vs 3rd C/E/F/H/I', home: { id: 'MEX', name: 'Mexico', flag: '🇲🇽' }, away: getThird(2, '3rd Place C/E/F/H/I') },
    { id: 'R32_8', name: 'Match 8', date: 'July 1', label: 'Group L winner vs 3rd E/H/I/J/K', home: getTeam('L', 0), away: getThird(3, '3rd Place E/H/I/J/K') },
    { id: 'R32_9', name: 'Match 9', date: 'July 1', label: 'Group G winner vs 3rd A/E/H/I/J', home: getTeam('G', 0), away: getThird(4, '3rd Place A/E/H/I/J') },
    { id: 'R32_10', name: 'Match 10', date: 'July 1', label: 'United States vs 3rd B/E/F/I/J', home: { id: 'USA', name: 'United States', flag: '🇺🇸' }, away: getThird(5, '3rd Place B/E/F/I/J') },
    { id: 'R32_11', name: 'Match 11', date: 'July 2', label: 'Group H winner vs Group J runner-up', home: getTeam('H', 0), away: getTeam('J', 1) },
    { id: 'R32_12', name: 'Match 12', date: 'July 2', label: 'Group K runner-up vs Group L runner-up', home: getTeam('K', 1), away: getTeam('L', 1) },
    { id: 'R32_13', name: 'Match 13', date: 'July 2', label: 'Group B winner vs 3rd E/F/G/I/J', home: getTeam('B', 0), away: getThird(6, '3rd Place E/F/G/I/J') },
    { id: 'R32_14', name: 'Match 14', date: 'July 3', label: 'Group D runner-up vs Group G runner-up', home: getTeam('D', 1), away: getTeam('G', 1) },
    { id: 'R32_15', name: 'Match 15', date: 'July 3', label: 'Argentina vs Group H runner-up', home: { id: 'ARG', name: 'Argentina', flag: '🇦🇷' }, away: getTeam('H', 1) },
    { id: 'R32_16', name: 'Match 16', date: 'July 3', label: 'Group K winner vs 3rd D/E/I/J/L', home: getTeam('K', 0), away: getThird(7, '3rd Place D/E/I/J/L') },
  ];

  return initialR32.map(match => ({
    ...match,
    homeScore: '',
    awayScore: '',
    homePen: '',
    awayPen: '',
  }));
}

// Determines the exact winner of a knockout fixture
export function getWinner(match) {
  if (!match) return null;
  const h = parseFloat(match.homeScore);
  const a = parseFloat(match.awayScore);
  
  if (isNaN(h) || isNaN(a)) return null;

  if (h > a) return match.home;
  if (a > h) return match.away;

  // It's a draw, check for penalties
  const hp = parseFloat(match.homePen);
  const ap = parseFloat(match.awayPen);
  
  if (isNaN(hp) || isNaN(ap)) return null; // Undecided penalty shootout
  return hp > ap ? match.home : match.away;
}

// Determines the loser of a match (needed for the 3rd place playoff)
export function getLoser(match) {
  const winner = getWinner(match);
  if (!winner) return null;
  return winner.id === match.home.id ? match.away : match.home;
}