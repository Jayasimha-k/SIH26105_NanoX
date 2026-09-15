import React from 'react';
import { Server, Database, Cloud, HardDrive, Shield } from 'lucide-react';

export default function AssetsView({ assets }) {
  const getIcon = (type) => {
    if (type.includes('Database')) return <Database className="w-5 h-5 text-amber-400" />;
    if (type.includes('Cloud')) return <Cloud className="w-5 h-5 text-cyan-400" />;
    return <Server className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Enterprise Asset Inventory & Exposure</h2>
          <p className="text-slate-400 text-xs mt-1">Asset criticality ratings, financial replacement valuation, and exposure postures</p>
        </div>
        <span className="cyber-badge bg-cyan-950 text-cyan-400 border border-cyan-800">5 High-Value Assets</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assets.map((asset) => (
          <div key={asset.id} className="cyber-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                {getIcon(asset.asset_type)}
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400">{asset.id}</span>
                <h3 className="font-bold text-slate-100 text-sm">{asset.name}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Criticality Score</span>
                <span className="font-bold text-amber-400 text-sm">{asset.criticality_score} / 10.0</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Asset Financial Value</span>
                <span className="font-bold text-emerald-400 text-sm">₹{(asset.financial_value / 100000).toFixed(1)} Lakhs</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">IP Address:</span>
                <span className="font-mono text-slate-200">{asset.ip_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exposure Posture:</span>
                <span className={`cyber-badge text-[10px] ${asset.exposure_level === 'INTERNET_FACING' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                  {asset.exposure_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asset Owner:</span>
                <span className="text-slate-300">{asset.owner}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
