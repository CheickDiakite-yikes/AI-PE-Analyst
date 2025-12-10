import React, { useState } from 'react';
import { Agent, AgentRole, AgentStatus } from '../types';
import { BrainCircuit, Briefcase, Search, Activity, User, ShieldCheck, Palette, ChevronUp, ChevronDown, Zap } from 'lucide-react';

interface AgentNetworkProps {
  agents: Agent[];
  activeEdge?: string | null;
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
  const getIcon = () => {
    switch (agent.role) {
      case AgentRole.MD: return <BrainCircuit className="w-6 h-6 text-apex-accent" />;
      case AgentRole.VP: return <Briefcase className="w-5 h-5 text-blue-400" />;
      case AgentRole.ASSOCIATE: return <Activity className="w-5 h-5 text-emerald-400" />;
      case AgentRole.SCOUT: return <Search className="w-4 h-4 text-purple-400" />;
      case AgentRole.COMPS: return <User className="w-4 h-4 text-pink-400" />;
      case AgentRole.DILIGENCE: return <ShieldCheck className="w-4 h-4 text-green-400" />;
      case AgentRole.DESIGN: return <Palette className="w-4 h-4 text-pink-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (agent.status) {
      case AgentStatus.THINKING: return 'border-apex-accent shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse bg-apex-800';
      case AgentStatus.WORKING: return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] bg-apex-800';
      case AgentStatus.COMPLETED: return 'border-emerald-500 opacity-80 bg-apex-900';
      case AgentStatus.ERROR: return 'border-red-500 bg-red-900/20';
      default: return 'border-apex-800 opacity-60 bg-apex-900';
    }
  };

  return (
    <div className={`
      relative flex flex-col p-4 rounded-xl border backdrop-blur-md transition-all duration-300 w-48 z-10
      ${getStatusColor()}
    `}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-black rounded-lg border border-apex-700 shadow-inner">
          {getIcon()}
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">{agent.name.split(' ')[0]}</h3>
          <p className="text-[10px] text-apex-accentDim font-mono">{agent.role.replace(' Agent', '')}</p>
        </div>
      </div>
      
      <div className="h-4 overflow-hidden">
        {agent.status !== AgentStatus.IDLE && (
          <p className="text-[10px] text-gray-400 animate-pulse truncate font-mono">
            {agent.status === AgentStatus.THINKING ? "Thinking..." : agent.currentTask || "Processing..."}
          </p>
        )}
      </div>
    </div>
  );
};

export const AgentNetwork: React.FC<AgentNetworkProps> = ({ agents, activeEdge }) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed to save space

  const md = agents.find(a => a.role === AgentRole.MD);
  const vp = agents.find(a => a.role === AgentRole.VP);
  const swarm = agents.filter(a => a.role !== AgentRole.MD && a.role !== AgentRole.VP);

  // SVG Connection Helper
  const ConnectionLine = ({ active }: { active: boolean }) => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
      <line 
        x1="50%" y1="0" x2="50%" y2="100%" 
        stroke={active ? "#d4af37" : "#262626"} 
        strokeWidth={active ? "2" : "1"}
        strokeDasharray={active ? "4 4" : "none"}
        className={active ? "animate-flow" : ""}
      />
    </svg>
  );

  return (
    <div className={`
        w-full bg-apex-900/30 rounded-2xl border border-apex-800/50 relative overflow-hidden transition-all duration-500 ease-in-out
        ${isCollapsed ? 'h-[80px] hover:border-apex-accent/30' : 'py-8 px-4'}
    `}>
        {/* Header / Controls */}
        <div className="absolute top-4 left-4 flex items-center gap-3 z-20">
            <div className="flex items-center gap-2 opacity-70">
                <ShieldCheck className={`w-4 h-4 ${activeEdge ? 'text-apex-accent animate-pulse' : 'text-gray-500'}`} />
                <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400">
                    Neural Swarm {activeEdge ? <span className="text-apex-accent font-bold">PROCESSING</span> : 'IDLE'}
                </span>
            </div>
        </div>

        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors z-50 border border-transparent hover:border-white/10"
        >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isCollapsed ? (
            /* Compact Pulse Bar View */
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pl-24 pr-16 animate-fade-in">
                <div className="flex items-center gap-1 md:gap-3 w-full max-w-2xl justify-between px-4">
                    {agents.map((agent, idx) => {
                        const isActive = agent.status === AgentStatus.WORKING || agent.status === AgentStatus.THINKING;
                        const isError = agent.status === AgentStatus.ERROR;
                        return (
                            <div key={agent.id} className="group relative flex flex-col items-center gap-2 transition-all">
                                {/* Connection Line in Compact Mode */}
                                {idx < agents.length - 1 && (
                                    <div className="absolute left-[calc(100%+0.25rem)] top-1.5 w-full md:w-8 h-[1px] bg-apex-800 -z-10 hidden md:block" />
                                )}
                                
                                <div className={`
                                    w-3 h-3 md:w-4 md:h-4 rounded-full border transition-all duration-500
                                    ${isActive 
                                        ? 'bg-apex-accent border-apex-accent shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-125' 
                                        : isError
                                            ? 'bg-red-500 border-red-500'
                                            : 'bg-apex-900 border-apex-700 hover:border-gray-500'}
                                `}>
                                    {isActive && <div className="absolute inset-0 rounded-full bg-apex-accent animate-ping opacity-50" />}
                                </div>
                                <span className={`
                                    text-[8px] md:text-[9px] font-mono uppercase tracking-wider transition-colors opacity-60 group-hover:opacity-100 whitespace-nowrap
                                    ${isActive ? 'text-apex-accent font-bold opacity-100' : 'text-gray-500'}
                                `}>
                                    {agent.role.split(' ')[0]}
                                </span>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-black border border-apex-800 px-2 py-1 rounded text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl">
                                    {agent.name}: {agent.status}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            /* Expanded Full Visualization */
            <div className="flex flex-col items-center gap-12 mt-4 animate-slide-down">
                {/* Level 1: MD */}
                <div className="relative">
                    {md && <AgentCard agent={md} />}
                    {/* Connection to VP */}
                    <div className="absolute left-1/2 top-full h-12 w-px bg-apex-800 -translate-x-1/2">
                        {activeEdge?.includes('MD-VP') && (
                            <div className="absolute inset-0 w-full h-full bg-apex-accent animate-pulse shadow-[0_0_10px_#d4af37]" />
                        )}
                    </div>
                </div>

                {/* Level 2: VP */}
                <div className="relative">
                    {vp && <AgentCard agent={vp} />}
                    {/* Branching to Swarm */}
                    <div className="absolute left-1/2 top-full h-12 w-px bg-apex-800 -translate-x-1/2">
                        {activeEdge?.startsWith('VP-') && (
                            <div className="absolute inset-0 w-full h-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
                        )}
                    </div>
                    
                    {/* Horizontal Bar */}
                    <div className="absolute top-[calc(100%+3rem)] left-1/2 -translate-x-1/2 w-[90%] h-px bg-apex-800"></div>
                </div>

                {/* Level 3: Swarm */}
                <div className="flex flex-wrap justify-center gap-6 w-full pt-4">
                    {swarm.map((agent, i) => {
                        const isRelevantEdge = activeEdge?.includes(agent.role.split(' ')[0].toUpperCase());
                        return (
                            <div key={agent.id} className="relative flex flex-col items-center">
                                {/* Vertical Connector */}
                                <div className="h-6 w-px bg-apex-800 -mt-10 mb-4 relative">
                                    {isRelevantEdge && <div className="absolute inset-0 bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />}
                                </div>
                                <AgentCard agent={agent} />
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      
      <style>{`
        @keyframes flow {
          to { stroke-dashoffset: -20; }
        }
        .animate-flow {
          animation: flow 1s linear infinite;
        }
        .animate-slide-down {
            animation: slideDown 0.3s ease-out forwards;
        }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};