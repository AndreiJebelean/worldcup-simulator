import React from 'react';

export default function GroupTables({ standings }) {
  return (
    /* REMOVED max-h and overflow-y-auto to eliminate the scrollbar */
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
      {Object.keys(standings).map(groupName => (
        <div key={groupName} className="backdrop-blur-md bg-white/[0.02] border border-white/5 rounded-xl p-4 shadow-xl flex flex-col">
          <h2 className="text-xs font-black text-green-400 tracking-wider mb-3 uppercase border-b border-white/5 pb-1.5">
            {groupName}
          </h2>
          <table className="w-full text-xs text-left text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-white/5 font-bold">
                <th className="pb-2 w-8">Pos</th>
                <th className="pb-2">Team</th>
                <th className="pb-2 text-center w-6">P</th>
                <th className="pb-2 text-center w-6">GD</th>
                <th className="pb-2 text-center w-6 text-green-400">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings[groupName].map((team, index) => (
                <tr key={team.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition">
                  <td className="py-2 font-bold text-gray-500">{index + 1}</td>
                  <td className="py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://flagcdn.com/20x15/${team.flag?.toLowerCase()}.png`}
                        alt={team.name}
                        className="rounded-sm object-cover shadow-sm border border-gray-800 w-5 h-[14px] shrink-0"
                      />
                      <span className="font-mono tracking-wide text-slate-200">{team.id}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center font-mono text-gray-400">{team.pld}</td>
                  <td className="py-2 text-center font-mono text-gray-400">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                  <td className="py-2 text-center font-mono font-bold text-green-400">{team.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}