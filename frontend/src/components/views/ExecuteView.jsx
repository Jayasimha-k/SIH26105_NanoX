import React, { useState } from 'react';
import {
  Wrench, ShieldCheck, CheckCircle2, AlertTriangle, Clock,
  FileCheck, Play, ArrowRight, X, ExternalLink, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

const initialRemediationTasks = [
  {
    id: 'TASK-101',
    rec_id: 'REC-001',
    priority: 'CRITICAL',
    asset: 'Production K8s Microservices Cluster',
    asset_id: 'ASSET-002',
    cve: 'CVE-2024-3094',
    cve_title: 'XZ Utils Liblzma Supply Chain Backdoor',
    control: 'Zero-Trust Microsegmentation & Network Isolation',
    status: 'IN_PROGRESS',
    due: 'Today (18:00 IST)',
    approved_by: 'CISO Executive Desk',
    risk_reduction: '₹14.2 Lakhs',
    reason: 'AI identified critical 94% exploit probability with active public exposure.',
    deployment_id: 'DEP-K8S-0941',
    patch_version: 'liblzma-5.6.1-patch2',
    notes: 'Configuring Cilium network policies to block lateral port 2222 egress.'
  },
  {
    id: 'TASK-102',
    rec_id: 'REC-002',
    priority: 'CRITICAL',
    asset: 'Core Oracle Production DB',
    asset_id: 'ASSET-001',
    cve: 'CVE-2024-21626',
    cve_title: 'runc Leaky File Descriptor Container Escape',
    control: 'Kernel Container Patching & Runtime Defense',
    status: 'PENDING',
    due: 'Today (20:00 IST)',
    approved_by: 'CISO Executive Desk',
    risk_reduction: '₹8.7 Lakhs',
    reason: 'CISA KEV active threat vector on mission-critical database host.',
    deployment_id: '',
    patch_version: '',
    notes: ''
  },
  {
    id: 'TASK-103',
    rec_id: 'REC-003',
    priority: 'HIGH',
    asset: 'Payment API Gateway',
    asset_id: 'ASSET-003',
    cve: 'CVE-2023-4863',
    cve_title: 'libwebp Heap Buffer Overflow Code Execution',
    control: 'Memory-Safe Buffer Shield & API Gateway WAF',
    status: 'PENDING',
    due: 'Tomorrow (12:00 IST)',
    approved_by: 'CISO Executive Desk',
    risk_reduction: '₹5.4 Lakhs',
    reason: 'Prevent heap memory corruption on external payment endpoint.',
    deployment_id: '',
    patch_version: '',
    notes: ''
  },
  {
    id: 'TASK-104',
    rec_id: 'REC-004',
    priority: 'HIGH',
    asset: 'Enterprise Active Directory Domain Controller',
    asset_id: 'ASSET-004',
    cve: 'CVE-2023-23397',
    cve_title: 'Microsoft Outlook NTLM Credential Theft & Relay',
    control: 'Strict NTLM Blocking & RPC Filtering GPO',
    status: 'AWAITING_VERIFICATION',
    due: 'Completed (Pending Verify)',
    approved_by: 'CISO Executive Desk',
    risk_reduction: '₹3.8 Lakhs',
    reason: 'Prevent credential hash theft via outgoing SMB connections.',
    deployment_id: 'DEP-GPO-4412',
    patch_version: 'KB5023397',
    notes: 'Firewall rules applied to block outbound TCP port 445 to internet.'
  },
  {
    id: 'TASK-105',
    rec_id: 'REC-005',
    priority: 'MEDIUM',
    asset: 'Executive Mobile Management Fleet',
    asset_id: 'ASSET-005',
    cve: 'CVE-2023-38606',
    cve_title: 'Apple WebKit & Kernel Privilege Escalation',
    control: 'Mobile Device Management Force Upgrade Policy',
    status: 'IN_PROGRESS',
    due: 'In 3 Days',
    approved_by: 'Security Lead',
    risk_reduction: '₹2.1 Lakhs',
    reason: 'Enforce iOS/iPadOS 16.6 rapid security response update across mobile devices.',
    deployment_id: 'DEP-MDM-8119',
    patch_version: 'iOS 16.6 Enterprise Profile',
    notes: 'Pushed over-the-air notification to 48 active devices.'
  }
];

export default function ExecuteView({ recommendations = [], currentRole, onRefresh }) {
  const [tasks, setTasks] = useState(initialRemediationTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [evidenceInputs, setEvidenceInputs] = useState({
    deployment_id: '',
    patch_version: '',
    notes: ''
  });
  const [actionNotice, setActionNotice] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const handleOpenDetail = (task) => {
    setSelectedTask(task);
    setEvidenceInputs({
      deployment_id: task.deployment_id || `DEP-${task.asset_id}-${Date.now().toString().slice(-4)}`,
      patch_version: task.patch_version || 'v2.4.1-prod',
      notes: task.notes || ''
    });
  };

  const handleMarkImplemented = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'AWAITING_VERIFICATION',
          deployment_id: evidenceInputs.deployment_id,
          patch_version: evidenceInputs.patch_version,
          notes: evidenceInputs.notes
        };
      }
      return t;
    }));

    setActionNotice(`Task ${taskId} has been marked as Deployed. Ready for Risk Verification!`);
    setSelectedTask(null);
    setTimeout(() => setActionNotice(null), 4000);
    if (onRefresh) onRefresh();
  };

  const handleRunVerification = async (taskId) => {
    setVerifyingId(taskId);
    setTimeout(() => {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: 'VERIFIED' };
        }
        return t;
      }));
      setVerifyingId(null);
      setActionNotice(`Risk Verification Complete for ${taskId}! Residual risk recalculated & confirmed.`);
      if (selectedTask?.id === taskId) setSelectedTask(null);
      setTimeout(() => setActionNotice(null), 4000);
      if (onRefresh) onRefresh();
    }, 1200);
  };

  // Stats calculation
  const totalTasks = tasks.length;
  const criticalPending = tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'VERIFIED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const awaitingVerify = tasks.filter(t => t.status === 'AWAITING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP TASK METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card border-l-4 border-l-blue-600">
          <p className="text-slate-600 text-xs font-semibold">Total Remediation Tasks</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-slate-900">{totalTasks}</h3>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">Active Queue</span>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-red-500">
          <p className="text-slate-600 text-xs font-semibold">Critical Tasks Pending</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-red-600">{criticalPending}</h3>
            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Urgent SLA</span>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-amber-500">
          <p className="text-slate-600 text-xs font-semibold">In Progress Deployment</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-amber-600">{inProgress}</h3>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">Deploying</span>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-emerald-500">
          <p className="text-slate-600 text-xs font-semibold">Awaiting Verification</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-emerald-600">{awaitingVerify}</h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Ready</span>
          </div>
        </div>
      </div>

      {/* MY REMEDIATION QUEUE TABLE */}
      <div className="cyber-card space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            Remediation Task Queue
          </h3>
          <span className="cyber-badge text-[10px]">Live Task Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Target Asset</th>
                <th className="py-2.5 px-3 font-semibold">Vulnerability</th>
                <th className="py-2.5 px-3 font-semibold">Approved Control</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Due SLA</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      task.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                      task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {task.priority === 'CRITICAL' && '🔴 '}
                      {task.priority === 'HIGH' && '🟠 '}
                      {task.priority === 'MEDIUM' && '🟡 '}
                      {task.priority}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{task.asset}</div>
                    <span className="text-[10px] font-mono text-slate-500">{task.asset_id}</span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-blue-700">{task.cve}</div>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">{task.cve_title}</span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{task.control}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">Reduction: {task.risk_reduction}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      task.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                      task.status === 'AWAITING_VERIFICATION' ? 'bg-sky-50 text-sky-700 border-sky-300' :
                      task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {task.due}
                  </td>

                  <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenDetail(task)}
                      className="cyber-button-secondary text-[11px] py-1 px-2.5"
                    >
                      Task Details
                    </button>

                    {task.status === 'AWAITING_VERIFICATION' ? (
                      <button
                        onClick={() => handleRunVerification(task.id)}
                        disabled={verifyingId === task.id}
                        className="cyber-button text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <RefreshCw className={`w-3 h-3 ${verifyingId === task.id ? 'animate-spin' : ''}`} />
                        {verifyingId === task.id ? 'Verifying...' : 'Verify Recalculation'}
                      </button>
                    ) : task.status === 'VERIFIED' ? (
                      <span className="text-[11px] text-emerald-700 font-bold px-2 py-1 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenDetail(task)}
                        className="cyber-button text-[11px] py-1 px-2.5"
                      >
                        <Wrench className="w-3 h-3" /> Deploy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REMEDIATION TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="cyber-badge text-[10px] mb-1">IT Remediation Task #{selectedTask.id}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTask.control}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Context Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Target Asset</span>
                <strong className="text-slate-800 text-xs font-sans">{selectedTask.asset}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Target CVE</span>
                <strong className="text-blue-700">{selectedTask.cve}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Approved By</span>
                <span className="text-slate-700 font-sans">{selectedTask.approved_by}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Expected Reduction</span>
                <strong className="text-emerald-600">{selectedTask.risk_reduction}</strong>
              </div>
            </div>

            {/* Reason */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs space-y-1">
              <strong className="text-blue-900 text-xs">Remediation Objective:</strong>
              <p className="text-slate-600 text-[11px] leading-relaxed">{selectedTask.reason}</p>
            </div>

            {/* Implementation Progress Pipeline */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Implementation Progress Status</span>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                <div className="p-1.5 rounded bg-blue-100 text-blue-700 border border-blue-200">1. Assigned</div>
                <div className={`p-1.5 rounded border ${selectedTask.status !== 'PENDING' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                  2. In Progress
                </div>
                <div className={`p-1.5 rounded border ${selectedTask.status === 'AWAITING_VERIFICATION' || selectedTask.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                  3. Deployed
                </div>
                <div className={`p-1.5 rounded border ${selectedTask.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-400'}`}>
                  4. Verified
                </div>
              </div>
            </div>

            {/* Deployment Evidence Inputs */}
            <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
              <h5 className="font-bold text-slate-800 text-xs">Deployment & Verification Evidence</h5>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-600 font-semibold mb-1">Deployment / Ticket ID</label>
                  <input
                    type="text"
                    value={evidenceInputs.deployment_id}
                    onChange={(e) => setEvidenceInputs({ ...evidenceInputs, deployment_id: e.target.value })}
                    placeholder="e.g. DEP-K8S-0941"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 font-semibold mb-1">Patch / Package Version</label>
                  <input
                    type="text"
                    value={evidenceInputs.patch_version}
                    onChange={(e) => setEvidenceInputs({ ...evidenceInputs, patch_version: e.target.value })}
                    placeholder="e.g. runc-1.1.12-prod"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-1">Implementation Notes & Output</label>
                <textarea
                  rows={2}
                  value={evidenceInputs.notes}
                  onChange={(e) => setEvidenceInputs({ ...evidenceInputs, notes: e.target.value })}
                  placeholder="Describe command execution, applied rules, or container cluster rollout..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setSelectedTask(null)}
                className="cyber-button-secondary text-xs"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarkImplemented(selectedTask.id)}
                  className="cyber-button text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Mark as Implemented
                </button>

                <button
                  onClick={() => handleRunVerification(selectedTask.id)}
                  disabled={verifyingId === selectedTask.id}
                  className="cyber-button text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === selectedTask.id ? 'animate-spin' : ''}`} />
                  Run Risk Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

