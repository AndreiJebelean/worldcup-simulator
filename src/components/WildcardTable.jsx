import React from 'react';

export default function WildcardTable({ thirdPlaceStandings }) {
  return (
    <div className="w-full bg-transparent flex flex-col">
      <h2 className="text-xs font-black text-cyan-400 tracking-wider mb-1 uppercase">
        📊 3rd Place Ranking
      </h2>
      <p className="text-[10px] text-gray-500 mb-3 pb-1.5 border-b border-white/5 font-medium uppercase tracking-wider">Top 8 Advance to Playoffs</p>

      {/* REMOVED max-h and overflow-y-auto to let the table expand naturally */}
      <div className="w-full pr-1">
        <table className="w-full text-xs text-left text-gray-300">
          <thead>
            <tr className="text-gray-500 border-b border-white/5 font-bold">
              <th className="pb-2 w-8">Pos</th>
              <th className="pb-2">Team</th>
              <th className="pb-2 text-center w-8">Gr</th>
              <th className="pb-2 text-center w-8">GD</th>
              <th className="pb-2 text-center w-8 text-cyan-400">Pts</th>
            </tr>
          </thead>
          <tbody>
            {thirdPlaceStandings?.map((team, index) => {
              const isQualifying = index < 8;
              return (
                <tr
                  key={team.id}
                  className={`border-b border-white/[0.02] transition-colors duration-200 ${
                    isQualifying ? 'bg-green-500/[0.02] hover:bg-green-500/[0.05]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className={`py-2 font-bold ${isQualifying ? 'text-green-400' : 'text-gray-500'}`}>
                    {index + 1}
                  </td>
                  <td className="py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <img 
                        src={`https://flagcdn.com/20x15/${team.flag?.toLowerCase()}.png`} 
                        alt="" 
                        className="rounded-sm border border-gray-800 shadow-sm w-5 h-[14px] shrink-0 object-cover" 
                      />
                      <span className="font-mono tracking-wide text-slate-200">{team.id}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center font-mono text-gray-400 font-bold">{team.originGroup}</td>
                  <td className="py-2 text-center font-mono text-gray-400">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                  <td className={`py-2 text-center font-mono font-black ${isQualifying ? 'text-green-400' : 'text-gray-400'}`}>
                    {team.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}