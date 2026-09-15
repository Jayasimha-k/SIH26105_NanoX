import React from 'react';
import { Cpu, CheckCircle2, Award, AlertCircle } from 'lucide-react';

export default function ModelPerformanceView({ metadata }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-400" />
            ML Model Validation & Empirical Performance Monitor
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Audited validation metrics provided directly by ML research team in model metadata JSON
          </p>
        </div>
        <span className="cyber-badge bg-purple-950 text-purple-400 border border-purple-800">No Fabricated Metrics</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {metadata && Object.entries(metadata).map(([key, meta]) => {
          const metrics = meta.performance_metrics;
          return (
            <div key={key} className={`cyber-card space-y-4 ${key === 'meta_model' ? 'border-2 border-cyan-500' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="cyber-badge bg-slate-900 text-cyan-400 font-mono text-[10px]">{key}</span>
                  <h3 className="font-bold text-slate-100 text-sm mt-1">{meta.model_name}</h3>
                  <p className="text-[11px] text-slate-400">{meta.model_type} (v{meta.version})</p>
                </div>
              </div>

              <p className="text-xs text-slate-300">{meta.description}</p>

              {metrics ? (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">ROC-AUC Score</span>
                      <span className="font-bold text-cyan-400">{(metrics.roc_auc * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">PR-AUC Score</span>
                      <span className="font-bold text-purple-400">{(metrics.pr_auc * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Precision / Recall</span>
                      <span className="font-semibold text-slate-200">{(metrics.precision * 100).toFixed(1)}% / {(metrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Brier Score</span>
                      <span className="font-semibold text-emerald-400">{metrics.brier_score}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-900 text-slate-500 text-xs rounded">
                  No performance metrics recorded in metadata.json yet.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
