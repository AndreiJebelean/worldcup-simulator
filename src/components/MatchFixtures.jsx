import React, { useState, useRef, useEffect } from 'react';

export default function MatchFixtures({ matches, isEditing, timezone, onScoreChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Extract all unique country names from the match database dynamically
  const allNations = React.useMemo(() => {
    const nationsMap = new Map();
    matches.forEach(m => {
      if (m.homeTeam) nationsMap.set(m.homeTeam, m.homeFlag);
      if (m.awayTeam) nationsMap.set(m.awayTeam, m.awayFlag);
    });
    return Array.from(nationsMap.entries())
      .map(([name, flag]) => ({ name, flag }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  // 2. Filter the nations list based on the search text for the dropdown options
  const suggestedNations = allNations.filter(nation => 
    nation.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // 3. Filter your fixture cards down using the active text bar
  const filteredMatches = matches.filter(match => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    return (
      match.homeTeam?.toLowerCase().includes(query) ||
      match.awayTeam?.toLowerCase().includes(query) ||
      `group ${match.group?.toLowerCase()}`.includes(query)
    );
  });

  // 4. Group matches by their respective letters
  const matchesByGroup = filteredMatches.reduce((groups, match) => {
    const group = match.group || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(match);
    return groups;
  }, {});

  // Handle clicking outside the dropdown pane to hide it automatically
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatMatchDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const dayStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: timezone }).toUpperCase();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });
      return { dayStr, timeStr };
    } catch {
      return { dayStr: '---', timeStr: '--:--' };
    }
  };

  return (
    <div className="space-y-4 max-h-[82vh] flex flex-col relative">
      
      {/* SEARCH ENGINE WITH INTEGRATED CYBER DROPDOWN */}
      <div className="relative w-full px-1 pb-2 group-search" ref={dropdownRef}>
        <div className="absolute inset-y-0 left-4 top-0 flex items-center pointer-events-none text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          type="text"
          placeholder="SEARCH OR SELECT NATION..."
          value={searchQuery}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          className="w-full h-10 pl-9 pr-24 bg-slate-950/60 border border-white/[0.06] focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 rounded-xl text-[10px] font-mono font-black tracking-widest text-cyan-400 placeholder-slate-600 focus:outline-none transition-all uppercase"
        />

        {/* HIGH VISIBILITY ACTION CLEAR BUTTON */}
        {searchQuery && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setShowDropdown(false);
            }}
            className="absolute right-3 top-1.5 px-2.5 py-1 flex items-center gap-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 font-mono text-[9px] font-black tracking-wider transition-all duration-200 shadow-sm"
          >
            <span>CLEAR</span>
            <span className="text-xs font-sans font-bold leading-none">✕</span>
          </button>
        )}

        {/* FLOATING AUTOCOMPLETE DROPDOWN BOARD */}
        {showDropdown && suggestedNations.length > 0 && (
          <div className="absolute left-1 right-1 mt-1 max-h-48 overflow-y-auto bg-[#0a1021]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 custom-scrollbar divide-y divide-white/[0.03]">
            {suggestedNations.map(nation => (
              <button
                key={nation.name}
                onClick={() => {
                  setSearchQuery(nation.name);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-cyan-500/10 text-left transition-colors group/item"
              >
                <img 
                  src={`https://flagcdn.com/20x15/${nation.flag?.toLowerCase()}.png`} 
                  className="w-5 h-[14px] rounded-sm object-cover border border-white/10 shrink-0" 
                  alt="" 
                />
                <span className="font-mono text-xs font-bold text-slate-300 group-hover/item:text-cyan-400 uppercase tracking-wider">
                  {nation.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MATCH SCROLL CONTAINER */}
      <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {Object.keys(matchesByGroup).length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/[0.04] rounded-xl bg-white/[0.01]">
            <p className="font-mono text-[10px] font-black tracking-widest text-slate-600 uppercase">
              NO MATRIX MATCHES FOUND FOR "{searchQuery}"
            </p>
          </div>
        ) : (
          Object.keys(matchesByGroup).sort().map(groupName => (
            <div key={groupName} className="space-y-3">
              {/* Group Header Badge */}
              <div className="flex items-center gap-2 px-1">
                <span className="w-1.5 h-3.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-600 rounded-sm shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                <div className="text-[11px] font-black tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-slate-200 uppercase">
                  STAGE // GROUP {groupName}
                </div>
              </div>
              
              {/* Fixture Cards */}
              <div className="space-y-3">
                {matchesByGroup[groupName].map(match => {
                  const { dayStr, timeStr } = formatMatchDateTime(match.date);
                  
                  return (
                    <div 
                      key={match.id} 
                      className="group relative bg-[#070c19]/40 backdrop-blur-md border border-white/[0.04] hover:border-cyan-500/40 rounded-xl p-4 shadow-xl transition-all duration-300 flex flex-col gap-3 overflow-hidden"
                    >
                      {/* Laser accents */}
                      <div className="absolute top-0 right-0 w-[40px] h-[1px] bg-gradient-to-l from-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-0 right-0 w-[1px] h-[40px] bg-gradient-to-b from-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Main alignment Row */}
                      <div className="flex items-center justify-between w-full relative z-10">
                        
                        {/* Home Team */}
                        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                          <span className="font-mono text-xs font-black text-slate-200 tracking-widest uppercase truncate group-hover:text-white transition-colors">
                            {match.homeTeam}
                          </span>
                          <img 
                            src={`https://flagcdn.com/32x24/${match.homeFlag?.toLowerCase()}.png`} 
                            className="w-7 h-[19px] rounded-md object-cover shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-white/10 shrink-0 transform group-hover:scale-105 transition duration-300" 
                            alt="" 
                          />
                        </div>

                        {/* Scores */}
                        <div className="flex items-center justify-center gap-2 px-4 shrink-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.03] shadow-inner">
                              <input 
                                type="number" 
                                min="0"
                                value={match.homeScore ?? ''}
                                onChange={(e) => onScoreChange(match.id, 'homeScore', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                className="w-10 h-8 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 rounded-md text-center text-xs font-mono font-black text-cyan-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                              />
                              <span className="text-slate-700 font-bold text-xs px-0.5 select-none">-</span>
                              <input 
                                type="number" 
                                min="0"
                                value={match.awayScore ?? ''}
                                onChange={(e) => onScoreChange(match.id, 'awayScore', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                className="w-10 h-8 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 rounded-md text-center text-xs font-mono font-black text-cyan-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 font-mono text-xs font-black px-3 py-1 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-lg text-slate-200 shadow-md">
                              <span className={match.homeScore > match.awayScore ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" : ""}>
                                {match.homeScore ?? '-'}
                              </span>
                              <span className="text-slate-600 font-medium">:</span>
                              <span className={match.awayScore > match.homeScore ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" : ""}>
                                {match.awayScore ?? '-'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
                          <img 
                            src={`https://flagcdn.com/32x24/${match.awayFlag?.toLowerCase()}.png`} 
                            className="w-7 h-[19px] rounded-md object-cover shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-white/10 shrink-0 transform group-hover:scale-105 transition duration-300" 
                            alt="" 
                          />
                          <span className="font-mono text-xs font-black text-slate-200 tracking-widest uppercase truncate group-hover:text-white transition-colors">
                            {match.awayTeam}
                          </span>
                        </div>

                      </div>

                      {/* Info Stripe */}
                      <div className="flex items-center justify-center gap-3 text-[9px] font-mono font-black tracking-[0.15em] text-slate-500 border-t border-white/[0.03] pt-2 mt-0.5 select-none">
                        <div className="flex items-center gap-1 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.02]">
                          <span className="text-slate-400">{dayStr}</span>
                        </div>
                        <span className="text-slate-700">•</span>
                        <div className="flex items-center gap-1">
                          <span className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors">{timeStr}</span>
                          <span className="text-slate-600 font-medium">SYS_TZ</span>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}