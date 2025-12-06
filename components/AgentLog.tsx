
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, AgentRole, AgentStatus } from '../types';
import { Terminal, ChevronDown, ChevronUp, Clock, AlertTriangle, Hash } from 'lucide-react';

interface AgentLogProps {
  logs: LogEntry[];
}

export const AgentLog: React.FC<AgentLogProps> = ({ logs }) => {
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  return (
    <div className="border border-apex-800 rounded-xl overflow-hidden bg-apex-900/50 flex flex-col max-h-[300px] transition-all duration-300">
        <div 
            className="flex items-center justify-between p-3 bg-apex-800/30 cursor-pointer hover:bg-apex-800/50 transition-colors select-none"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                <Terminal className="w-3 h-3" />
                System Log
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-[10px] text-gray-600 font-mono">{logs.length} Events</span>
                {isOpen ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
            </div>
        </div>
        
        {isOpen && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin min-h-[150px]">
                {logs.length === 0 && (
                    <div className="text-xs text-gray-600 font-mono p-2 italic">System ready. Waiting for tasks...</div>
                )}
                {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}
            </div>
        )}
    </div>
  );
};

const LogItem: React.FC<{ log: LogEntry }> = ({ log }) => {
    const [showDetails, setShowDetails] = useState(false);
    const hasError = log.status === AgentStatus.ERROR && log.errorDetails;

    return (
        <div className="flex flex-col border-l-2 border-transparent hover:border-apex-700 hover:bg-white/5 rounded transition-colors">
            <div 
                className="flex gap-2 text-[10px] font-mono items-start p-1.5 cursor-pointer"
                onClick={() => hasError && setShowDetails(!showDetails)}
            >
                <div className="flex flex-col items-end gap-1 min-w-[50px]">
                    <span className="text-gray-600 whitespace-nowrap">
                        {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {log.traceId && (
                        <span className="flex items-center gap-0.5 text-[8px] text-gray-700" title={`Trace ID: ${log.traceId}`}>
                            <Hash className="w-2 h-2" />
                            {log.traceId.slice(-4)}
                        </span>
                    )}
                </div>
                
                <div className="flex flex-col w-full min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`
                            font-bold whitespace-nowrap
                            ${log.role === AgentRole.MD ? 'text-apex-accent' : ''}
                            ${log.role === AgentRole.VP ? 'text-blue-400' : ''}
                            ${log.role === AgentRole.ASSOCIATE ? 'text-emerald-400' : ''}
                            ${log.role === AgentRole.SCOUT ? 'text-purple-400' : ''}
                            ${log.role === AgentRole.COMPS ? 'text-pink-400' : ''}
                            ${log.role === AgentRole.DESIGN ? 'text-pink-400' : ''}
                        `}>
                            {log.agentName}
                        </span>
                        
                        <StatusBadge status={log.status} />

                        {log.latency && (
                            <span className="flex items-center gap-1 text-[9px] text-gray-600 ml-auto">
                                <Clock className="w-2.5 h-2.5" />
                                {log.latency}ms
                            </span>
                        )}
                    </div>
                    
                    <span className={`break-words leading-tight ${log.status === AgentStatus.ERROR ? 'text-red-400' : 'text-gray-300 opacity-90'}`}>
                        {log.message}
                    </span>
                </div>
            </div>

            {hasError && showDetails && (
                 <div className="ml-14 mr-2 mb-2 p-2 bg-red-950/20 border border-red-900/30 rounded text-[10px] font-mono text-red-300 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1 font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        Error Details
                    </div>
                    <div className="mb-1">{log.errorDetails?.message}</div>
                    {log.errorDetails?.stack && (
                        <div className="pl-2 border-l border-red-900/50 opacity-50 overflow-x-auto whitespace-pre">
                            {log.errorDetails.stack.split('\n')[0]} 
                            {/* Showing only first line of stack for brevity in UI */}
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

const StatusBadge: React.FC<{ status: AgentStatus }> = ({ status }) => {
    let styles = "";
    switch (status) {
        case AgentStatus.WORKING: styles = 'border-blue-900/50 text-blue-400 bg-blue-900/10'; break;
        case AgentStatus.THINKING: styles = 'border-apex-accentDim/30 text-apex-accentDim bg-apex-accentDim/5'; break;
        case AgentStatus.COMPLETED: styles = 'border-emerald-900/50 text-emerald-400 bg-emerald-900/10'; break;
        case AgentStatus.ERROR: styles = 'border-red-900/50 text-red-400 bg-red-900/10'; break;
        case AgentStatus.IDLE: styles = 'border-gray-800 text-gray-600'; break;
    }
    
    return (
        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase border font-bold tracking-wider ${styles}`}>
            {status}
        </span>
    );
};
