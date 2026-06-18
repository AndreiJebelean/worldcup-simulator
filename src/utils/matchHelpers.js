import { OFFICIAL_GROUPS } from "./tournamentData";

// Helper function to auto-generate all matches with real opening kickoff times
export const generateAllMatches = () => {
  let matchId = 1;
  const fixtures = [];

  Object.keys(OFFICIAL_GROUPS).forEach((groupName) => {
    const teams = OFFICIAL_GROUPS[groupName];
    // Standard round-robin pairings
    const pairings = [
      [0, 1], [2, 3], // Round 1
      [0, 2], [3, 1], // Round 2
      [3, 0], [1, 2]  // Round 3
    ];
    
    pairings.forEach(([homeIdx, awayIdx], pairIdx) => {
      let matchDate;

      // Group A, Match 1 is the official opening match (Mexico vs South Africa)
      if (groupName === "Group A" && homeIdx === 0 && awayIdx === 1) {
        // June 11, 2026 at 19:00 UTC = 21:00 Berlin (CET) / 22:00 Bucharest (EET)
        matchDate = new Date(Date.UTC(2026, 5, 11, 19, 0));
      } else if (groupName === "Group A" && homeIdx === 2 && awayIdx === 3) {
        // Next match on opening night (South Korea vs Czechia)
        matchDate = new Date(Date.UTC(2026, 5, 11, 22, 0));
      } else {
        // Dynamically stagger all subsequent matches based on group and round order
        let dayOffset = 0;
        let hourSlot = 16;

        if (pairIdx < 2) {
          // Round 1 matches spread across June 12 - June 15
          dayOffset = 1 + Math.floor((matchId - 3) / 3);
          hourSlot = [16, 19, 22][(matchId - 3) % 3] || 16;
        } else if (pairIdx < 4) {
          // Round 2 matches spread across June 17 - June 21
          dayOffset = 6 + Math.floor((matchId - 25) / 3);
          hourSlot = [16, 19, 22][(matchId - 25) % 3] || 19;
        } else {
          // Round 3 final group matches spread across June 23 - June 27
          dayOffset = 12 + Math.floor((matchId - 49) / 2); // Simulates simultaneous final games
          hourSlot = (matchId % 2 === 0) ? 18 : 21;
        }

        matchDate = new Date(Date.UTC(2026, 5, 11, hourSlot, 0));
        matchDate.setUTCDate(matchDate.getUTCDate() + dayOffset);
      }

      fixtures.push({
        id: matchId++,
        group: groupName.replace("Group ", ""), // Normalizes key names to uniform strings like "A", "B", etc.
        home: teams[homeIdx].id,
        homeTeam: teams[homeIdx].id, // Added to fix MatchFixtures.jsx crash
        homeName: teams[homeIdx].name,
        homeFlag: teams[homeIdx].flag,
        away: teams[awayIdx].id,
        awayTeam: teams[awayIdx].id, // Added to fix MatchFixtures.jsx crash
        awayName: teams[awayIdx].name,
        awayFlag: teams[awayIdx].flag,
        homeScore: "",
        awayScore: "",
        date: matchDate.toISOString(), // Added to fix formatMatchTime() crash
        utcDateString: matchDate.toISOString()
      });
    });
  });
  return fixtures;
};

// Core Standings Calculator
export const calculateStandings = (matches) => {
  const standings = {};
  Object.keys(OFFICIAL_GROUPS).forEach(group => {
    standings[group] = OFFICIAL_GROUPS[group].map(team => ({
      ...team, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));
  });

  matches.forEach(m => {
    const hScore = parseInt(m.homeScore, 10);
    const aScore = parseInt(m.awayScore, 10);

    if (!isNaN(hScore) && !isNaN(aScore)) {
      // Handles fallback matching whether your group key says "Group A" or just "A"
      const groupKey = m.group.length === 1 ? `Group ${m.group}` : m.group;
      const groupTeams = standings[groupKey];
      
      if (groupTeams) {
        const homeTeam = groupTeams.find(t => t.id === m.home);
        const awayTeam = groupTeams.find(t => t.id === m.away);

        if (homeTeam && awayTeam) {
          homeTeam.pld += 1; awayTeam.pld += 1;
          homeTeam.gf += hScore; homeTeam.ga += aScore;
          awayTeam.gf += aScore; awayTeam.ga += hScore;

          if (hScore > aScore) {
            homeTeam.w += 1; homeTeam.pts += 3;
            awayTeam.l += 1;
          } else if (hScore < aScore) {
            awayTeam.w += 1; awayTeam.pts += 3;
            homeTeam.l += 1;
          } else {
            homeTeam.d += 1; homeTeam.pts += 1;
            awayTeam.d += 1; awayTeam.pts += 1;
          }
          homeTeam.gd = homeTeam.gf - homeTeam.ga;
          awayTeam.gd = awayTeam.gf - awayTeam.ga;
        }
      }
    }
  });

  Object.keys(standings).forEach(group => {
    standings[group].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  });

  return standings;
};

// Third Place Wildcard Ranking Logic
export const calculateThirdPlace = (currentStandings) => {
  const thirdPlaceTeams = [];
  Object.keys(currentStandings).forEach(groupName => {
    const groupTeams = currentStandings[groupName];
    if (groupTeams && groupTeams[2]) {
      thirdPlaceTeams.push({
        ...groupTeams[2],
        originGroup: groupName.replace("Group ", "")
      });
    }
  });
  return thirdPlaceTeams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
};