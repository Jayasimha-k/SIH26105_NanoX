import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCcw, ShieldCheck, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, Play, Activity, Lock, Cpu
} from 'lucide-react';
import { api } from '../../services/api';

export default function ThreatIntelView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updating, setUpdating] = useState(false);
  const [reassessing, setReassessing] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadThreats = async () => {
    setLoading(true);
    try {
      const res = await api.getThreatIntelligenceRecords(filterStatus === 'ALL' ? null : filterStatus);
      if (res && res.records) {
        setRecords(res.records);
      }
    } catch (err) {
      console.error('Failed to load threat records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreats();
  }, [filterStatus]);

  const handleRunThreatUpdate = async () => {
    setUpdating(true);
    setNotification(null);
    try {
      const res = await api.triggerThreatIngestion(true); // Offline-first local feed ingestion
      if (res?.result) {
        setNotification({
          type: 'success',
          message: `Threat Update Complete: Ingested ${res.result.ingested_count} items (${res.result.validated_count} validated, ${res.result.pending_count} pending, ${res.result.duplicate_count} deduplicated).`
        });
      }
      await loadThreats();
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Threat Update Failed: ${err.message}`
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRunReassessment = async () => {
    setReassessing(true);
    setNotification(null);
    try {
      const res = await api.triggerThreatReassessment();
      if (res?.reassessments) {
        setNotification({
          type: 'success',
          message: `Reassessment Complete: Evaluated P1-P6 & Fusion v2 for ${res.reassessed_count} threats. Anchored to Hyperledger Fabric.`
        });
      }
      await loadThreats();
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Reassessment Failed: ${err.message}`
      });
    } finally {
      setReassessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Continuous Cyber Threat Intelligence
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              Offline-First Air-Gapped
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Local threat feed ingestion, cryptographic deduplication, authoritative validation, and Fusion v2 multi-modal risk reassessment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunThreatUpdate}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Ingesting...' : 'Run Threat Update'}
          </button>

          <button
            onClick={handleRunReassessment}
            disabled={reassessing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Play className={`w-4 h-4 text-emerald-400 ${reassessing ? 'animate-pulse' : ''}`} />
            {reassessing ? 'Evaluating...' : 'Trigger Reassessment'}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs & Summary Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {['ALL', 'VALIDATED', 'VALIDATED_DEMO', 'PENDING_VALIDATION', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {records.length} records
        </span>
      </div>

      {/* Threat Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Source & Title</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">CVE ID</th>
                <th className="px-4 py-3">Affected Technology</th>
                <th className="px-4 py-3">Validation Status</th>
                <th className="px-4 py-3">First Seen</th>
                <th className="px-4 py-3">Assessment Status</th>
                <th className="px-4 py-3">Last Reassessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading threat records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No threat records found. Click <strong>Run Threat Update</strong> to ingest local or cached feeds.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.threat_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900 text-xs truncate" title={r.title}>
                        {r.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{r.source}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {r.published_at ? new Date(r.published_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.cve ? (
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {r.cve}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[150px] truncate" title={r.affected_product || 'General'}>
                      {r.affected_product || 'General / Multi-vendor'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.validation_status === 'VALIDATED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Validated
                        </span>
                      )}
                      {r.validation_status === 'VALIDATED_DEMO' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                          <Cpu className="w-3 h-3" /> Demo Sim
                        </span>
                      )}
                      {r.validation_status === 'PENDING_VALIDATION' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {r.validation_status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {r.first_seen_at ? new Date(r.first_seen_at).toLocaleDateString() : 'Just now'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.model_assessment_status === 'ASSESSED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          <Lock className="w-3 h-3 text-indigo-600" /> Assessed (Fusion v2)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Pending Assessment
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {r.processed_at ? new Date(r.processed_at).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
