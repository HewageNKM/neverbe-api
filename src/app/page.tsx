import React from "react";

export default function Home() {
  return (
    <main className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-8 mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase mb-2">
              NEVERBE API
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-medium font-mono">
              Core Backend Services v1.0
            </p>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-400 text-sm font-bold tracking-wider uppercase">
              System Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-800/80">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Environment
            </p>
            <p className="text-white text-lg font-semibold">Production</p>
          </div>
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-800/80">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Database
            </p>
            <p className="text-white text-lg font-semibold">Connected</p>
          </div>
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-800/80">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Firebase Auth
            </p>
            <p className="text-white text-lg font-semibold">Active</p>
          </div>
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-800/80">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Data Node
            </p>
            <p className="text-white text-lg font-semibold">asia-south1</p>
          </div>
        </div>

        <div className="mt-12 text-center border-t border-gray-800 pt-8">
          <p className="text-gray-600 text-xs font-medium tracking-widest uppercase">
            Restricted System • Unauthorized access is strictly prohibited
          </p>
        </div>
      </div>
    </main>
  );
}
