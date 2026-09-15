import React from 'react';
import { FolderTree, Code, CheckCircle, FileJson, Info } from 'lucide-react';

export default function PlugAndPlayConfigView({ metadata }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-cyan-400" />
            Plug-and-Play Model Architecture & Integration Guide
          </h2>
          <p className="text-slate-400 text-xs mt-1">Zero backend refactoring required when dropping in ML team trained model artifacts</p>
        </div>
        <span className="cyber-badge bg-emerald-950 text-emerald-400 border border-emerald-800">Adapter Pattern Active</span>
      </div>

      <div className="cyber-card space-y-4">
        <h3 className="font-bold text-slate-200 text-sm">Target Model Package Contract</h3>
        <p className="text-xs text-slate-300">
          Tell your ML team to drop their trained binary artifacts (`model.pkl` or `model.joblib`) into their respective subdirectories inside <code className="text-cyan-400">backend/models_artifacts/</code>:
        </p>

        <div className="p-4 bg-slate-950 font-mono text-xs rounded-lg text-slate-300 border border-slate-800 leading-relaxed overflow-x-auto">
          <div>models_artifacts/</div>
          <div>├── model_1/ (Exploitability Predictor)</div>
          <div>│ &nbsp; ├── model.pkl &lt;-- ML Team trained artifact</div>
          <div>│ &nbsp; ├── metadata.json &lt;-- Contract specification</div>
          <div>│ &nbsp; └── requirements.txt</div>
          <div>├── model_2/ (Threat Intelligence Scorer)</div>
          <div>├── model_3/ (Asset Exposure Model)</div>
          <div>├── model_4/ (Blast Radius Evaluator)</div>
          <div>└── meta_model/ (Stacking Ensemble Classifier)</div>
        </div>

        <div className="p-4 bg-cyan-950/30 rounded-lg border border-cyan-800 text-xs space-y-2 text-cyan-200">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <CheckCircle className="w-4 h-4 text-cyan-400" /> Standard Metadata Contract (metadata.json)
          </div>
          <p>
            The backend dynamically parses <code className="text-cyan-300">input_features</code>, <code className="text-cyan-300">output_type</code>, and <code className="text-cyan-300">feature_weights</code> at runtime. Replacing models requires zero code changes in the frontend or risk engine.
          </p>
        </div>
      </div>
    </div>
  );
}
