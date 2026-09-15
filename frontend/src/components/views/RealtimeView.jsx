import React from 'react';
import { Activity, Radio, CheckCircle, AlertOctagon } from 'lucide-react';

export default function RealtimeView({ eventLog, wsStatus }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Real-Time Two-Way WebSocket Communication Stream
          </h2>
          <p className="text-slate-400 text-xs mt-1">Live pub/sub broadcast events across CISO, SOC Analyst, and IT Remediation teams</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
          <span className="cyber-badge bg-slate-900 border border-slate-800 text-slate-300">
            WS Status: {wsStatus}
          </span>
        </div>
      </div>

      <div className="cyber-card space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          Live Event Activity Stream ({eventLog.length} Events Received)
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {eventLog.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
              No live WebSocket events received yet. Approve a control or trigger an execution to watch real-time broadcasts stream in!
            </div>
          ) : (
            eventLog.map((ev, i) => (
              <div key={i} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold">{ev.event_type}</span>
                  <span className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 font-sans">{ev.title || ev.recommendation_id}</p>
                {ev.block_hash && (
                  <p className="text-[10px] text-slate-500 truncate">Anchored Block Hash: {ev.block_hash}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
