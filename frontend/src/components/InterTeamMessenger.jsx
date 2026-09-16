import React, { useState } from 'react';
import { MessageSquare, Send, AlertTriangle, CheckCircle2, ShieldAlert, X, ArrowRight, Bell } from 'lucide-react';

export default function InterTeamMessenger({ currentRole, messages, onSendMessage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientRole, setRecipientRole] = useState('ALL');
  const [urgency, setUrgency] = useState('WARNING');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const newMsg = {
      id: `MSG-${Date.now()}`,
      event_type: 'INTER_TEAM_MESSAGE',
      sender_role: currentRole,
      recipient_role: recipientRole,
      urgency,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      target_tab: urgency === 'CRITICAL' ? 'approvals' : 'execution'
    };

    onSendMessage(newMsg);
    setTitle('');
    setBody('');
  };

  const unreadCount = messages.length;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Messenger Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="cyber-button py-3 px-4 rounded-full shadow-2xl flex items-center gap-2 border border-[#ED9E5B]/50 hover:scale-105 transition-all"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-[#E9BCB9]" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">Realtime Team Messenger</span>
        </button>
      )}

      {/* Expanded Messenger Drawer */}
      {isOpen && (
        <div className="w-96 md:w-[420px] bg-[#141124] border border-[#662249] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px] border-t-4 border-t-[#A34054] animate-in slide-in-from-bottom duration-200">
          {/* Drawer Header */}
          <div className="p-4 bg-[#0D0B18] border-b border-[#44174E] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#A34054]/30 rounded-lg text-[#ED9E5B] border border-[#A34054]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#E9BCB9]">Inter-Team Realtime Messenger</h3>
                <p className="text-[10px] text-[#E9BCB9]/70">Sending as: <span className="font-bold text-[#ED9E5B]">{currentRole}</span></p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#E9BCB9]/60 hover:text-[#E9BCB9] p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#0A0914]/80 max-h-[340px]">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-[#E9BCB9]/60 text-xs italic">
                No inter-team messages sent yet. Compose a directive below!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    msg.urgency === 'CRITICAL'
                      ? 'bg-red-950/20 border-red-500/40 text-[#E9BCB9]'
                      : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#ED9E5B]">{msg.sender_role}</span>
                      <span>&rarr;</span>
                      <span className="cyber-badge text-[9px] px-1.5 py-0.5">{msg.recipient_role}</span>
                    </div>
                    <span className="text-[#E9BCB9]/60 font-mono">{msg.timestamp}</span>
                  </div>

                  <h4 className="font-bold text-xs text-[#E9BCB9] flex items-center gap-1.5">
                    {msg.urgency === 'CRITICAL' && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    {msg.title}
                  </h4>

                  <p className="text-[11px] text-[#E9BCB9]/80 leading-relaxed">{msg.body}</p>

                  {msg.target_tab && (
                    <button
                      onClick={() => {
                        onNavigate(msg.target_tab);
                        setIsOpen(false);
                      }}
                      className="mt-1 text-[10px] font-bold text-[#ED9E5B] hover:text-[#E9BCB9] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Take Action in {msg.target_tab.toUpperCase()}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* New Message Form */}
          <form onSubmit={handleSend} className="p-3 bg-[#0D0B18] border-t border-[#44174E] space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-[#E9BCB9]/70 font-semibold mb-0.5">Recipient Role</label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  className="w-full bg-[#141124] border border-[#44174E] rounded-lg px-2 py-1 text-[11px] text-[#E9BCB9]"
                >
                  <option value="ALL">All Teams</option>
                  <option value="CISO">CISO</option>
                  <option value="SOC">SOC Analyst</option>
                  <option value="Security">Security Lead</option>
                  <option value="IT">IT Remediation</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#E9BCB9]/70 font-semibold mb-0.5">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full bg-[#141124] border border-[#44174E] rounded-lg px-2 py-1 text-[11px] text-[#E9BCB9]"
                >
                  <option value="CRITICAL">🚨 Critical Alert</option>
                  <option value="WARNING">⚠️ Directive</option>
                  <option value="INFO">ℹ️ General Note</option>
                </select>
              </div>
            </div>

            <input
              type="text"
              placeholder="Message Subject / Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#141124] border border-[#44174E] rounded-lg px-2.5 py-1.5 text-xs text-[#E9BCB9] focus:outline-none focus:border-[#A34054]"
            />

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type real-time message or directive..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 bg-[#141124] border border-[#44174E] rounded-lg px-2.5 py-1.5 text-xs text-[#E9BCB9] focus:outline-none focus:border-[#A34054]"
              />
              <button
                type="submit"
                className="cyber-button px-3 py-1.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
