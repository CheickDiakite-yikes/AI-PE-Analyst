import React, { useState, useEffect } from 'react';
import { AgentNetwork } from './components/AgentNetwork';
import { ChatInterface } from './components/ChatInterface';
import { DealDashboard } from './components/DealDashboard';
import { PortCoDashboard } from './components/PortCoDashboard';
import { AgentLog } from './components/AgentLog';
import { Agent, AgentRole, AgentStatus, Message, DealData, LogEntry, DeliverableType, FileAttachment, PortfolioCompany } from './types';
import { 
    getMDStrategy, 
    scoutPotentialTargets, 
    selectBestTarget, 
    performDeepDive, 
    generateDealStructure, 
    generateConceptImage, 
    verifyLocation,
    getMDFinalOpinion,
    generateDeliverableContent,
    generateSlideDesign,
    analyzeDocument,
    ingestPortfolioDocuments
} from './services/geminiService';
import { Terminal, LayoutDashboard, Settings, Activity, Briefcase, Trash2 } from 'lucide-react';

const HISTORICAL_MANDATE = "Historically: North American Healthcare Services & Industrials. EBITDA > $15M. Aversion: Pre-revenue.";

const INITIAL_AGENTS: Agent[] = [
  { id: '1', role: AgentRole.MD, name: 'Athena (MD)', status: AgentStatus.IDLE, description: 'Strategy & Risk' },
  { id: '2', role: AgentRole.VP, name: 'Marcus (VP)', status: AgentStatus.IDLE, description: 'Orchestration' },
  { id: '3', role: AgentRole.ASSOCIATE, name: 'Ken (Associate)', status: AgentStatus.IDLE, description: 'Modeling' },
  { id: '4', role: AgentRole.SCOUT, name: 'Scout-Alpha', status: AgentStatus.IDLE, description: 'Data Mining' },
  { id: '5', role: AgentRole.DILIGENCE, name: 'Sarah (Diligence)', status: AgentStatus.IDLE, description: 'Doc Analysis' },
  { id: '6', role: AgentRole.COMPS, name: 'Comps-Beta', status: AgentStatus.IDLE, description: 'Market Multiples' },
  { id: '7', role: AgentRole.DESIGN, name: 'Sienna (Design)', status: AgentStatus.IDLE, description: 'Visual Assets' },
];

const INITIAL_MESSAGES: Message[] = [
    {
        id: '0',
        role: 'system',
        content: `DiDi AI System initialized.\nHistorical Context: "${HISTORICAL_MANDATE}"`,
        timestamp: new Date(),
        sender: "SYSTEM"
    }
];

const dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
    }
    return value;
};

function App() {
  const [agents, setAgents] = useState<Agent[]>(() => {
      try {
          const saved = localStorage.getItem('didi_agents');
          return saved ? JSON.parse(saved) : INITIAL_AGENTS;
      } catch (e) { return INITIAL_AGENTS; }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
      try {
          const saved = localStorage.getItem('didi_messages');
          return saved ? JSON.parse(saved, dateReviver) : INITIAL_MESSAGES;
      } catch (e) { return INITIAL_MESSAGES; }
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
      try {
          const saved = localStorage.getItem('didi_logs');
          return saved ? JSON.parse(saved, dateReviver) : [];
      } catch (e) { return []; }
  });

  const [currentView, setCurrentView] = useState<'deal' | 'portfolio'>(() => {
      const saved = localStorage.getItem('didi_currentView');
      return (saved as 'deal' | 'portfolio') || 'deal';
  });

  const [dealData, setDealData] = useState<DealData | null>(() => {
      try {
          const saved = localStorage.getItem('didi_dealData');
          const parsed = saved ? JSON.parse(saved, dateReviver) : null;
          if (parsed && (!parsed.financialModels || !parsed.lboModel)) return null;
          return parsed;
      } catch (e) { return null; }
  });

  const [portfolio, setPortfolio] = useState<PortfolioCompany[]>(() => {
      try {
          const saved = localStorage.getItem('didi_portfolio');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeEdge, setActiveEdge] = useState<string | null>(null);

  useEffect(() => { try { localStorage.setItem('didi_agents', JSON.stringify(agents)); } catch(e) {} }, [agents]);
  useEffect(() => { try { localStorage.setItem('didi_messages', JSON.stringify(messages)); } catch(e) {} }, [messages]);
  useEffect(() => { try { localStorage.setItem('didi_logs', JSON.stringify(logs)); } catch(e) {} }, [logs]);
  useEffect(() => { try { localStorage.setItem('didi_currentView', currentView); } catch(e) {} }, [currentView]);
  useEffect(() => { try { localStorage.setItem('didi_dealData', JSON.stringify(dealData)); } catch(e) {} }, [dealData]);
  useEffect(() => { try { localStorage.setItem('didi_portfolio', JSON.stringify(portfolio)); } catch(e) {} }, [portfolio]);

  const resetState = () => {
      if (confirm("Are you sure you want to clear all data and reset the system?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const generateTraceId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

  const updateAgent = (role: AgentRole, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.role === role ? { ...a, ...updates } : a));
  };

  const updateAllAgents = (updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => ({ ...a, ...updates })));
  };

  const addMessage = (role: 'user' | 'model' | 'system', content: string, sender?: string, attachments?: any[], inputAttachments?: FileAttachment[], suggestedActions?: string[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      sender,
      attachments,
      inputAttachments,
      suggestedActions
    }]);
  };

  const runStep = async <T,>(
    agentRole: AgentRole,
    description: string,
    fn: () => Promise<T>,
    traceId: string
  ): Promise<T> => {
    const startTime = performance.now();
    const agentName = INITIAL_AGENTS.find(a => a.role === agentRole)?.name || "Unknown";
    
    updateAgent(agentRole, { status: AgentStatus.WORKING, currentTask: description });

    try {
        const result = await fn();
        const duration = Math.round(performance.now() - startTime);
        
        setLogs(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            traceId,
            timestamp: new Date(),
            agentName,
            role: agentRole,
            message: `${description} - Completed`,
            status: AgentStatus.COMPLETED,
            latency: duration
        }]);

        updateAgent(agentRole, { status: AgentStatus.IDLE, currentTask: "Standby" });
        return result;

    } catch (error: any) {
        const duration = Math.round(performance.now() - startTime);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        setLogs(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            traceId,
            timestamp: new Date(),
            agentName,
            role: agentRole,
            message: `FAILED: ${description}`,
            status: AgentStatus.ERROR,
            latency: duration,
            errorDetails: {
                message: errorMessage,
                stack: error.stack,
                context: description
            }
        }]);

        updateAgent(agentRole, { status: AgentStatus.ERROR, currentTask: "Error encountered" });
        throw error;
    }
  };

  const handlePortfolioIngest = async (files: FileAttachment[]) => {
    setIsProcessing(true);
    const traceId = generateTraceId();
    addMessage('system', `Ingesting ${files.length} portfolio documents...`, "SYSTEM");
    
    try {
        setActiveEdge('VP-DILIGENCE');
        
        const newCompanies = await runStep(
            AgentRole.DILIGENCE,
            "Parsing Portfolio Data & Normalizing Metrics",
            () => ingestPortfolioDocuments(files),
            traceId
        );
        
        setPortfolio(prev => [...prev, ...newCompanies]);
        addMessage('system', `Successfully onboarded ${newCompanies.length} companies to Portfolio Command.`, "SYSTEM", undefined, undefined, ["View Portfolio Dashboard", "Benchmark Active Deals"]);
        
    } catch (e) {
        console.error("Portfolio ingestion error", e);
        addMessage('system', "Portfolio ingestion failed. See logs.", "SYSTEM");
    } finally {
        setIsProcessing(false);
        setActiveEdge(null);
    }
  };

  const handleDeliverableGeneration = async (type: DeliverableType) => {
    if (!dealData) return;
    const traceId = generateTraceId();
    
    try {
        updateAgent(AgentRole.DESIGN, { status: AgentStatus.THINKING, currentTask: `Drafting content structure for ${type}...` });
        
        const slides = await runStep(
            AgentRole.DESIGN,
            `Drafting ${type} content`,
            () => generateDeliverableContent(dealData, type),
            traceId
        );
        
        const newDeliverable = {
            id: Date.now().toString(),
            type,
            title: `${dealData.companyName} - ${type}`,
            status: 'rendering' as const,
            slides: slides,
            createdAt: new Date()
        };

        setDealData(prev => prev ? {
            ...prev,
            deliverables: [...(prev.deliverables || []), newDeliverable]
        } : null);

        const updatedSlides = [...slides];
        for (let i = 0; i < slides.length; i++) {
            const imageUrl = await runStep(
                AgentRole.DESIGN,
                `Rendering visual for Slide ${i+1}/${slides.length}`,
                () => generateSlideDesign(slides[i], dealData.companyName),
                traceId
            );

            if (imageUrl) {
                updatedSlides[i] = { ...updatedSlides[i], imageUrl };
                setDealData(prev => {
                    if (!prev || !prev.deliverables) return prev;
                    return {
                        ...prev,
                        deliverables: prev.deliverables.map(d => 
                            d.id === newDeliverable.id 
                            ? { ...d, slides: updatedSlides } 
                            : d
                        )
                    };
                });
            }
        }

        setDealData(prev => {
            if (!prev || !prev.deliverables) return prev;
            return {
                ...prev,
                deliverables: prev.deliverables.map(d => 
                    d.id === newDeliverable.id 
                    ? { ...d, status: 'completed' } 
                    : d
                )
            };
        });
        
        addMessage('system', `${type} for ${dealData.companyName} has been generated. Check the Deliverables tab.`);

    } catch (e) {
        console.error("Deliverable gen failed", e);
    } finally {
        setTimeout(() => updateAgent(AgentRole.DESIGN, { status: AgentStatus.IDLE }), 3000);
    }
  };

  const handleUserMessage = async (text: string, attachments?: FileAttachment[]) => {
    addMessage('user', text, undefined, undefined, attachments);
    setIsProcessing(true);
    const traceId = generateTraceId();

    try {
      if (attachments && attachments.length > 0) {
         setActiveEdge('MD-DILIGENCE');
         addMessage('system', "Documents detected. Activating Diligence Agent for analysis...", "SYSTEM");
         
         const analysisResult = await runStep(
            AgentRole.DILIGENCE,
            "Analyzing & Extracting Data from Documents",
            () => analyzeDocument(attachments, text),
            traceId
         );
         
         setActiveEdge('DILIGENCE-ASSOCIATE');
         const structuredData = await runStep(
            AgentRole.ASSOCIATE,
            "Building Financial Model from Extracted Data",
            () => generateDealStructure(analysisResult.companyName || "Target", JSON.stringify(analysisResult), [], portfolio),
            traceId
         );
         
         setDealData(structuredData);
         setCurrentView('deal');
         
         setActiveEdge('ASSOCIATE-MD');
         updateAgent(AgentRole.MD, { status: AgentStatus.THINKING, currentTask: "Reviewing Diligence Findings..." });
         
         const finalOpinion = await runStep(
            AgentRole.MD,
            "Formulating Investment Opinion",
            () => getMDFinalOpinion(structuredData, HISTORICAL_MANDATE, text || "Analyze this deal"),
            traceId
         );
         
         const actions = ["Create Pitch Deck", "Generate One Pager", "Export LBO Model"];
         addMessage('model', finalOpinion, "Athena (MD)", undefined, undefined, actions);

      } else {
          const mdStrategy = await runStep(
              AgentRole.MD,
              "Analyzing Mandate & Strategy",
              () => getMDStrategy(text, HISTORICAL_MANDATE),
              traceId
          );
          addMessage('model', mdStrategy, "Athena (MD)");
          
          updateAgent(AgentRole.MD, { status: AgentStatus.IDLE });
          updateAgent(AgentRole.VP, { status: AgentStatus.WORKING, currentTask: "Dispatching Scout Swarm..." }); 
          setActiveEdge('MD-VP');

          const potentialTargets = await runStep(
              AgentRole.SCOUT,
              "Market Scan & Sourcing (Live Web)",
              () => scoutPotentialTargets(mdStrategy),
              traceId
          );
          setActiveEdge('VP-SCOUT');

          if (potentialTargets.length === 0) {
              throw new Error("Scout returned 0 targets. Try refining your search criteria.");
          }

          const targetsListStr = potentialTargets.join(", ");
          setLogs(prev => [...prev, {
            id: Date.now().toString(),
            traceId,
            timestamp: new Date(),
            agentName: "Scout-Alpha",
            role: AgentRole.SCOUT,
            message: `Identified candidates: ${targetsListStr}`,
            status: AgentStatus.COMPLETED
          }]);

          updateAgent(AgentRole.VP, { status: AgentStatus.THINKING, currentTask: `Selecting best fit from: ${potentialTargets.length} candidates...` });
          
          const bestTarget = await runStep(
              AgentRole.VP,
              "Target Filtering & Selection",
              () => selectBestTarget(potentialTargets, text), 
              traceId
          );

          setActiveEdge('VP-SCOUT');
          // UPDATED: Log the "Live Search" aspect for user visibility
          const deepDivePromise = runStep(
              AgentRole.SCOUT,
              `Triangulated Deep Dive: ${bestTarget} (Financials/News/Benchmarks)`,
              () => performDeepDive(bestTarget),
              traceId
          );

          updateAgent(AgentRole.COMPS, { status: AgentStatus.WORKING, currentTask: "Spreading Multiples..." });
          const deepDiveData = await deepDivePromise;
          
          setLogs(prev => [...prev, {
              id: Date.now().toString(),
              traceId,
              timestamp: new Date(),
              agentName: "Comps-Beta",
              role: AgentRole.COMPS,
              message: "Comparable Set Analysis (Simulated)",
              status: AgentStatus.COMPLETED,
              latency: 150 
          }]);
          updateAgent(AgentRole.COMPS, { status: AgentStatus.IDLE });

          setActiveEdge('VP-ASSOCIATE');
          const structuredData = await runStep(
              AgentRole.ASSOCIATE,
              "Constructing LBO & Financial Models (Gap Filling Active)",
              () => generateDealStructure(bestTarget, deepDiveData.text, potentialTargets, portfolio),
              traceId
          );

          let locationMaps: string[] = [];
          if (structuredData.companyName) {
              locationMaps = await runStep(
                  AgentRole.SCOUT,
                  "HQ Location Verification",
                  () => verifyLocation(structuredData.companyName),
                  traceId
              );
          }

          structuredData.groundingUrls = [...(deepDiveData.sources || []), ...locationMaps];
          if (locationMaps.length > 0) structuredData.location = "HQ Verified via Google Maps";
          setDealData(structuredData);
          setCurrentView('deal');

          let imageAttachment = null;
          if (structuredData.companyName) {
            const imageUrl = await runStep(
                AgentRole.VP,
                "Generating Asset (Logo)",
                () => generateConceptImage(structuredData.companyName + " " + structuredData.sector + " logo"),
                traceId
            );
            if (imageUrl) imageAttachment = { type: 'image', url: imageUrl };
          }

          setActiveEdge('ASSOCIATE-MD');
          updateAgent(AgentRole.MD, { status: AgentStatus.THINKING, currentTask: "Final Investment Committee Review..." });
          
          const finalOpinion = await runStep(
              AgentRole.MD,
              "Formulating Investment Opinion",
              () => getMDFinalOpinion(structuredData, HISTORICAL_MANDATE, text),
              traceId
          );
          
          const actions = [
            `Create Teaser for ${structuredData.companyName}`, 
            `Run sensitivity analysis`, 
            "Export CSV Model"
          ];
          
          addMessage('model', finalOpinion, "Athena (MD)", imageAttachment ? [imageAttachment] : undefined, undefined, actions);
      }

    } catch (error) {
      console.error("Pipeline Error:", error);
      const errMessage = error instanceof Error ? error.message : "Unknown error";
      addMessage('system', `Pipeline Execution Failed: ${errMessage}. \n\nCheck the System Log for details.`, "SYSTEM");
      updateAllAgents({ status: AgentStatus.ERROR });
    } finally {
      setIsProcessing(false);
      setActiveEdge(null);
    }
  };

  return (
    <div className="flex h-screen bg-apex-900 text-gray-200 overflow-hidden font-sans selection:bg-apex-accent selection:text-black">
      <div className="w-16 md:w-20 flex flex-col items-center py-6 border-r border-apex-800 bg-apex-900 z-10 flex-shrink-0">
        <div className="mb-8 p-2 rounded bg-apex-accent/10 border border-apex-accent/20">
          <Terminal className="w-6 h-6 text-apex-accent" />
        </div>
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setCurrentView('deal')}
            className={`p-3 rounded transition-colors relative group ${currentView === 'deal' ? 'bg-apex-800 text-apex-accent' : 'hover:bg-apex-800 text-gray-500'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <div className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-800 z-50 pointer-events-none">Deal Dashboard</div>
          </button>
          <button 
            onClick={() => setCurrentView('portfolio')}
            className={`p-3 rounded transition-colors relative group ${currentView === 'portfolio' ? 'bg-apex-800 text-apex-accent' : 'hover:bg-apex-800 text-gray-500'}`}
          >
            <Briefcase className="w-5 h-5" />
             <div className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-800 z-50 pointer-events-none">PortCo Command</div>
          </button>
           <button 
             onClick={resetState}
             className="p-3 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors group relative mt-auto"
             title="Reset & Clear Data"
           >
            <Trash2 className="w-5 h-5" />
             <div className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-800 z-50 pointer-events-none text-red-400">Reset System</div>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 gap-6 relative scrollbar-thin">
             
             <div className="flex justify-between items-end pb-4 border-b border-apex-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">DiDi <span className="text-apex-accent">AI</span></h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="w-3 h-3 text-gray-500" />
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wide">
                            MANDATE: {HISTORICAL_MANDATE}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-800">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono text-emerald-400">SYSTEM ONLINE</span>
                    </div>
                </div>
             </div>

             <section>
                <h2 className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Active Agent Swarm
                </h2>
                <AgentNetwork agents={agents} activeEdge={activeEdge} />
             </section>

             <section>
                 <AgentLog logs={logs} />
             </section>

             <section className="flex-1 min-h-[400px]">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        {currentView === 'deal' ? 'Live Deal Environment' : 'Portfolio Intelligence'}
                    </h2>
                    {currentView === 'deal' && !dealData && <span className="text-xs text-apex-700 italic">Waiting for target identification...</span>}
                </div>
                <div className="h-full bg-apex-900/50 rounded-xl border border-apex-800/50 p-1 shadow-inner">
                    {currentView === 'deal' ? (
                        dealData ? (
                            <DealDashboard 
                              data={dealData} 
                              onGenerateDeliverable={handleDeliverableGeneration}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-apex-800 gap-4 py-12">
                                <Activity className="w-16 h-16 opacity-20" />
                                <p className="text-sm font-mono opacity-40">NO ACTIVE DEAL CONTEXT</p>
                            </div>
                        )
                    ) : (
                        <PortCoDashboard 
                            portfolio={portfolio}
                            onIngest={handlePortfolioIngest}
                            isProcessing={isProcessing}
                        />
                    )}
                </div>
             </section>
        </div>

        <div className="w-full md:w-[450px] h-[50vh] md:h-full border-t md:border-t-0 border-apex-800 shadow-2xl z-20 flex flex-col flex-shrink-0">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleUserMessage} 
            isProcessing={isProcessing}
          />
        </div>

      </div>
    </div>
  );
}

export default App;