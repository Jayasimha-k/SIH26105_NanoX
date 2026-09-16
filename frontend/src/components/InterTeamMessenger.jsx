import React, { useState } from 'react';
import { MessageSquare, Send, AlertTriangle, X, ArrowRight, Bell, Zap, ShieldAlert, Wrench, CheckCircle2 } from 'lucide-react';

const TAB_NAME_MAP = {
  dashboard: 'Executive Overview',
  threat_intel: 'Threat Intelligence',
  asset_inventory: 'Asset Portfolio',
  ai_quantification: 'AI Risk Quantification',
  optimizer: 'Investment Optimizer',
  approvals: 'CISO Approval Hub',
  execution: 'Remediation Queue',
  recalculate: 'Continuous Recalculation',
  audit: 'Blockchain Audit Ledger',
  business_value: 'Business Value'
};

export default function InterTeamMessenger({ currentRole, messages, onSendMessage, onNavigate, isOpen, onClose }) {
  const [recipientRole, setRecipientRole] = useState('ALL');
  const [urgency, setUrgency] = useState('WARNING');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const content = body.trim();
    if (!content && !title.trim()) return;

    // Smart fallback title generation if user types only a body (e.g. "hi")
    const effectiveTitle = title.trim() || (
      urgency === 'CRITICAL' ? `🚨 Critical Security Alert from ${currentRole}` :
      urgency === 'WARNING' ? `⚠️ Directive from ${currentRole}` : `💬 Inter-Team Note from ${currentRole}`
    );
    const effectiveBody = content || title.trim();

    const targetTab = (
      urgency === 'CRITICAL' ? 'approvals' :
      currentRole === 'SOC' ? 'threat_intel' :
      currentRole === 'CISO' ? 'execution' : 'dashboard'
    );

    const newMsg = {
      id: `MSG-${Date.now()}`,
      event_type: 'INTER_TEAM_MESSAGE',
      sender_role: currentRole,
      recipient_role: recipientRole,
      urgency,
      title: effectiveTitle,
      body: effectiveBody,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      target_tab: targetTab
    };

    onSendMessage(newMsg);
    setTitle('');
    setBody('');
  };

  const applyTemplate = (type) => {
    if (type === 'CVE_ALERT') {
      setRecipientRole('CISO');
      setUrgency('CRITICAL');
      setTitle('Active Wild Exploitation Flagged: CVE-2024-21626');
      setBody('CISA KEV confirms active exploitation on Customer Portal Cluster. Requesting urgent risk quantification & mitigation approval.');
    } else if (type === 'APPROVAL_REQ') {
      setRecipientRole('CISO');
      setUrgency('CRITICAL');
      setTitle('Request for Control Budget Approval: REC-001');
      setBody('PuLP solver selected Zero-Trust Microsegmentation (₹10L budget). Requires executive sign-off in Approval Hub.');
    } else if (type === 'IT_DISPATCH') {
      setRecipientRole('IT');
      setUrgency('WARNING');
      setTitle('IT Control Deployment Directive');
      setBody('CISO approved REC-001. Please execute control deployment and confirm implementation.');
    }
  };

  return (
    <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Expanded Messenger Drawer */}
      <div className="w-96 md:w-[440px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[640px] border-t-4 border-t-blue-600">
        {/* Drawer Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800">Inter-Team Directives & Messenger</h3>
              <p className="text-[10px] text-slate-500">Sender: <span className="font-bold text-blue-600">{currentRole}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

          {/* Quick Pre-set Directive Templates */}
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => applyTemplate('CVE_ALERT')}
              className="px-2 py-1 bg-white hover:bg-red-50 border border-red-200 rounded-lg text-red-600 font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <ShieldAlert className="w-3 h-3" /> Flag CVE
            </button>
            <button
              onClick={() => applyTemplate('APPROVAL_REQ')}
              className="px-2 py-1 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-blue-600 font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Zap className="w-3 h-3" /> Request Approval
            </button>
            <button
              onClick={() => applyTemplate('IT_DISPATCH')}
              className="px-2 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Wrench className="w-3 h-3" /> Dispatch IT
            </button>
          </div>

          {/* Messages Stream */}
          <div className="p-3.5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 max-h-[320px]">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No inter-team messages sent yet. Compose a directive below!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    msg.urgency === 'CRITICAL'
                      ? 'bg-red-50 border-red-200 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-700">{msg.sender_role}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="cyber-badge text-[9px] px-1.5 py-0.5">{msg.recipient_role}</span>
                    </div>
                    <span className="text-slate-400 font-mono">{msg.timestamp}</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    {msg.urgency === 'CRITICAL' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    {msg.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 leading-relaxed">{msg.body}</p>

                  {msg.target_tab && (
                    <button
                      onClick={() => {
                        onNavigate(msg.target_tab);
                        setIsOpen(false);
                      }}
                      className="mt-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-1 rounded border border-blue-200"
                    >
                      <span>Take Action in {TAB_NAME_MAP[msg.target_tab] || msg.target_tab}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* New Message Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Target Recipient Role</label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Teams</option>
                  <option value="CISO">CISO</option>
                  <option value="SOC">SOC Analyst</option>
                  <option value="Security">Security Lead</option>
                  <option value="IT">IT Remediation</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="CRITICAL">🚨 Critical Alert</option>
                  <option value="WARNING">⚠️ Directive</option>
                  <option value="INFO">ℹ️ General Note</option>
                </select>
              </div>
            </div>

            <input
              type="text"
              placeholder="Message Subject / Title (Optional)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type message & press Enter to send..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="cyber-button px-3.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
