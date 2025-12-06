import React, { useState, useEffect, useCallback } from 'react';
import { DealData, FinancialSection, FinancialRow, Deliverable, DeliverableType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine
} from 'recharts';
import { 
  AlertTriangle, CheckCircle, ExternalLink, MapPin, Search, 
  FileText, PieChart, Target, Filter, Table as TableIcon, Download, Grid, Calculator, Presentation,
  Palette, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, X, Maximize2, Printer, Layout, ShieldAlert, Trophy, Users, BarChart2
} from 'lucide-react';

interface DealDashboardProps {
  data: DealData;
  isLoading?: boolean;
  onGenerateDeliverable?: (type: DeliverableType) => void;
}

type Tab = 'sourcing' | 'memo' | 'financials' | 'lbo' | 'valuation' | 'market' | 'deliverables';

export const DealDashboard: React.FC<DealDashboardProps> = ({ data, isLoading, onGenerateDeliverable }) => {
  const [activeTab, setActiveTab] = useState<Tab>('memo');

  if (isLoading) {
    return <div className="animate-pulse h-full w-full bg-apex-800/30 rounded-xl" />;
  }

  const exportToCSV = () => {
    if (!data.financialModels) return;
    
    const { years, incomeStatement, balanceSheet, cashFlow } = data.financialModels;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const addSection = (section: FinancialSection, timeLabels: string[]) => {
        csvContent += `\n${section.title.toUpperCase()}\n`;
        csvContent += `Metric,${timeLabels.join(",")}\n`;
        section.rows.forEach(row => {
            csvContent += `"${row.label}",${row.values.join(",")}\n`;
        });
    };

    csvContent += `DIDI AI - DEAL EXPORT - ${data.companyName.toUpperCase()}\n`;
    
    csvContent += `\n--- FINANCIAL MODELS ---\n`;
    addSection(incomeStatement, years);
    addSection(balanceSheet, years);
    addSection(cashFlow, years);

    if (data.lboDetailed) {
        csvContent += `\n--- LBO MODEL ---\n`;
        
        csvContent += `\nASSUMPTIONS\n`;
        data.lboDetailed.assumptions.forEach(a => {
            csvContent += `"${a.label}",${a.value}\n`;
        });

        csvContent += `\nSOURCES AND USES\n`;
        csvContent += `Sources,Amount,,Uses,Amount\n`;
        const maxRows = Math.max(data.lboDetailed.sources.length, data.lboDetailed.uses.length);
        for (let i = 0; i < maxRows; i++) {
            const source = data.lboDetailed.sources[i];
            const use = data.lboDetailed.uses[i];
            csvContent += `"${source?.label || ''}",${source?.value || ''},,"${use?.label || ''}",${use?.value || ''}\n`;
        }

        const projectionYears = years.length > 1 ? years.slice(1) : years;
        
        addSection(data.lboDetailed.debtSchedule, projectionYears);
        addSection(data.lboDetailed.projectedReturns, projectionYears);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${data.companyName.replace(/\s+/g, '_')}_Deal_Model.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-apex-800 pr-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <TabButton active={activeTab === 'sourcing'} onClick={() => setActiveTab('sourcing')} icon={<Filter className="w-3 h-3" />} label="SOURCING" />
            <TabButton active={activeTab === 'memo'} onClick={() => setActiveTab('memo')} icon={<FileText className="w-3 h-3" />} label="MEMO" />
            <TabButton active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} icon={<Grid className="w-3 h-3" />} label="FINANCIALS" />
            <TabButton active={activeTab === 'lbo'} onClick={() => setActiveTab('lbo')} icon={<Calculator className="w-3 h-3" />} label="LBO" />
            <TabButton active={activeTab === 'valuation'} onClick={() => setActiveTab('valuation')} icon={<PieChart className="w-3 h-3" />} label="VALUATION" />
            <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<Search className="w-3 h-3" />} label="MARKET" />
            <TabButton active={activeTab === 'deliverables'} onClick={() => setActiveTab('deliverables')} icon={<Presentation className="w-3 h-3" />} label="DELIVERABLES" />
        </div>
        
        {data.financialModels && activeTab !== 'deliverables' && (
            <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 bg-emerald-900/20 rounded border border-emerald-900/50"
                title="Export to Excel (CSV)"
            >
                <Download className="w-3 h-3" />
                EXPORT
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 pt-4 relative">
        {activeTab === 'sourcing' && <SourcingView data={data} />}
        {activeTab === 'memo' && <MemoView data={data} />}
        {activeTab === 'financials' && <FinancialsView data={data} />}
        {activeTab === 'lbo' && <LBOView data={data} />}
        {activeTab === 'valuation' && <ValuationView data={data} />}
        {activeTab === 'market' && <MarketView data={data} />}
        {activeTab === 'deliverables' && <DeliverablesView data={data} onGenerate={onGenerateDeliverable} />}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold tracking-wider transition-all whitespace-nowrap
      ${active 
        ? 'text-apex-accent border-b-2 border-apex-accent bg-apex-accent/5' 
        : 'text-gray-500 hover:text-gray-300 hover:bg-apex-800/30'}
    `}
  >
    {icon} {label}
  </button>
);

const FinancialTable: React.FC<{ section: FinancialSection, years: string[] }> = ({ section, years }) => (
    <div className="mb-8">
        <h4 className="text-xs font-bold text-apex-accent uppercase tracking-widest mb-3 border-l-2 border-apex-accent pl-2">
            {section.title}
        </h4>
        <div className="overflow-x-auto bg-apex-800/20 rounded border border-apex-800">
            <table className="w-full text-right border-collapse">
                <thead>
                    <tr className="bg-apex-900/50 text-[10px] font-mono text-gray-500 border-b border-apex-800">
                        <th className="text-left p-2 pl-4 font-medium w-48 sticky left-0 bg-apex-900 border-r border-apex-800">Metric (in millions)</th>
                        {years.map((y, i) => (
                            <th key={i} className="p-2 min-w-[80px]">{y}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-xs font-mono text-gray-300">
                    {section.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-apex-800/50 last:border-0 group">
                            <td className={`
                                text-left p-2 pl-4 sticky left-0 bg-apex-900 group-hover:bg-apex-800 transition-colors border-r border-apex-800
                                ${['Revenue', 'EBITDA', 'Net Income', 'Equity Value'].some(k => row.label.includes(k)) ? 'font-bold text-white' : 'text-gray-400'}
                            `}>
                                {row.label}
                            </td>
                            {row.values.map((val, vIdx) => (
                                <td key={vIdx} className="p-2">
                                    {val < 0 ? `(${Math.abs(val).toFixed(1)})` : val.toFixed(1)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const MemoView: React.FC<{ data: DealData }> = ({ data }) => {
    
    if (!data.memo) {
        return <div className="p-8 text-center text-gray-500">Memo data is currently unavailable. Please regenerate.</div>;
    }

    const downloadMemo = () => {
        let content = `# INVESTMENT MEMO: ${data.companyName.toUpperCase()}\n\n`;
        content += `**Date:** ${new Date().toLocaleDateString()}\n`;
        content += `**Sector:** ${data.sector}\n`;
        content += `**Recommendation:** ${data.memo.investmentRecommendation || "N/A"}\n\n`;

        content += `## EXECUTIVE SUMMARY\n${data.memo.executiveSummary || "N/A"}\n\n`;
        
        content += `## INVESTMENT THESIS\n`;
        data.memo.investmentThesis?.forEach(t => content += `- ${t}\n`);
        content += `\n`;

        if (data.memo.dealMerits) {
            content += `## DEAL MERITS\n`;
            data.memo.dealMerits.forEach(m => content += `- ${m}\n`);
            content += `\n`;
        }

        if (data.memo.keyRisks) {
            content += `## KEY RISKS & MITIGANTS\n`;
            data.memo.keyRisks.forEach(r => content += `- ${r}\n`);
            if (data.memo.riskMitigation) content += `\nMitigation Strategy:\n${data.memo.riskMitigation}\n`;
            content += `\n`;
        }

        content += `## MARKET OVERVIEW\n${data.memo.marketOverview || "N/A"}\n\n`;
        
        if (data.memo.competitiveLandscape) content += `## COMPETITIVE LANDSCAPE\n${data.memo.competitiveLandscape}\n\n`;
        if (data.memo.customerAnalysis) content += `## CUSTOMER ANALYSIS\n${data.memo.customerAnalysis}\n\n`;
        if (data.memo.operationalUpside) content += `## OPERATIONAL UPSIDE\n${data.memo.operationalUpside}\n\n`;
        
        if (data.memo.recommendationRationale) content += `## RECOMMENDATION RATIONALE\n${data.memo.recommendationRationale}\n\n`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.companyName.replace(/\s+/g, '_')}_Investment_Memo.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
            <div className="flex justify-between items-start border-b border-apex-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{data.companyName}</h2>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-mono uppercase">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {data.sector}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.location || "HQ N/A"}</span>
                        <span className="text-apex-accent border border-apex-accent/30 px-2 py-0.5 rounded bg-apex-accent/5">CONFIDENTIAL</span>
                    </div>
                </div>
                <button 
                    onClick={downloadMemo}
                    className="flex items-center gap-2 text-xs font-mono bg-apex-800 hover:bg-apex-700 text-gray-300 px-3 py-2 rounded border border-apex-700 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    DOWNLOAD MEMO
                </button>
            </div>

            <section className="bg-apex-800/20 p-6 rounded-lg border border-apex-800/50">
                <h3 className="text-sm font-bold text-apex-accent uppercase tracking-widest mb-3 border-l-2 border-apex-accent pl-3">Executive Summary</h3>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line font-serif">
                    {data.memo.executiveSummary || "Pending generation..."}
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-3 border-l-2 border-emerald-500 pl-3">Investment Thesis</h3>
                    <ul className="space-y-3">
                        {data.memo.investmentThesis?.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-300">
                                <span className="text-emerald-500 font-mono font-bold">0{i+1}</span>
                                <span className="leading-relaxed">{item}</span>
                            </li>
                        )) || <li className="text-sm text-gray-500 italic">No thesis points generated.</li>}
                    </ul>
                </section>
                
                {data.memo.dealMerits && (
                    <section>
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3 border-l-2 border-blue-400 pl-3 flex items-center gap-2">
                             Key Merits <Trophy className="w-4 h-4" />
                        </h3>
                        <ul className="space-y-3">
                            {data.memo.dealMerits.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-apex-900 border-y border-apex-800 py-6">
                <div>
                     <h4 className="text-xs text-gray-500 uppercase font-mono mb-2 flex items-center gap-2">
                        <BarChart2 className="w-3 h-3" /> Market Overview
                     </h4>
                     <p className="text-sm text-gray-400 leading-relaxed">{data.memo.marketOverview || "N/A"}</p>
                </div>
                {data.memo.competitiveLandscape && (
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-mono mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3" /> Competitive Landscape
                        </h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{data.memo.competitiveLandscape}</p>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.memo.customerAnalysis && (
                    <section>
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-3 border-l-2 border-purple-400 pl-3 flex items-center gap-2">
                            Customer Analysis <Users className="w-4 h-4" />
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed">{data.memo.customerAnalysis}</p>
                    </section>
                )}
                {data.memo.operationalUpside && (
                    <section>
                        <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-3 border-l-2 border-orange-400 pl-3">Operational Upside</h3>
                        <p className="text-sm text-gray-300 leading-relaxed">{data.memo.operationalUpside}</p>
                    </section>
                )}
            </div>

            <section className="bg-red-950/10 border border-red-900/30 rounded-lg p-6">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 border-l-2 border-red-500 pl-3">Key Risks & Mitigants</h3>
                <div className="space-y-4">
                    <ul className="space-y-2 mb-4">
                        {data.memo.keyRisks?.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-300">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                    {data.memo.riskMitigation && (
                        <div className="mt-4 pt-4 border-t border-red-900/20">
                            <h4 className="text-xs font-mono text-red-400 uppercase mb-2">Mitigation Strategy</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">{data.memo.riskMitigation}</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-12 p-6 bg-gradient-to-r from-apex-800/50 to-apex-900 border border-apex-700 rounded-xl">
                 <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Investment Committee Recommendation</h3>
                     <div className={`
                        px-4 py-1 rounded text-sm font-bold border
                        ${data.memo.investmentRecommendation === 'GO' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 
                          data.memo.investmentRecommendation === 'NO-GO' ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500'}
                     `}>
                        {data.memo.investmentRecommendation || "PENDING REVIEW"}
                     </div>
                 </div>
                 {data.memo.recommendationRationale && (
                     <p className="text-sm text-gray-300 leading-relaxed italic">
                        "{data.memo.recommendationRationale}"
                     </p>
                 )}
            </section>
        </div>
    );
};

const DeliverablesView: React.FC<{ data: DealData; onGenerate?: (type: DeliverableType) => void }> = ({ data, onGenerate }) => {
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [slideIndex, setSlideIndex] = useState(0);
    const [showSidebar, setShowSidebar] = useState(true);

    const selectedDeck = data.deliverables?.find(d => d.id === selectedDeckId);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedDeck) return;
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape') setSelectedDeckId(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDeck, slideIndex]);

    const nextSlide = () => {
        if (!selectedDeck) return;
        setSlideIndex(prev => (prev + 1) % selectedDeck.slides.length);
    };

    const prevSlide = () => {
        if (!selectedDeck) return;
        setSlideIndex(prev => (prev - 1 + selectedDeck.slides.length) % selectedDeck.slides.length);
    };

    const downloadSlide = () => {
        if (!selectedDeck) return;
        const currentSlide = selectedDeck.slides[slideIndex];
        if (!currentSlide.imageUrl) return;
        
        const link = document.createElement("a");
        link.href = currentSlide.imageUrl;
        link.download = `${data.companyName}_${selectedDeck.type}_Slide_${slideIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintDeck = () => {
        if (!selectedDeck) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = selectedDeck.slides.map((slide, i) => `
          <div style="page-break-after: always; display: flex; flex-direction: column; height: 100vh; justify-content: center; align-items: center; background: #fff;">
            ${slide.imageUrl ? `<img src="${slide.imageUrl}" style="max-width: 100%; max-height: 85vh; border: 1px solid #eee;" />` : `<div style="padding: 50px; border: 2px dashed #ccc;">Rendering Failed</div>`}
            <p style="font-family: sans-serif; font-size: 10px; color: #999; margin-top: 10px;">${data.companyName} | ${selectedDeck.type} | Slide ${i + 1}</p>
          </div>
        `).join('');

        printWindow.document.write(`
          <html>
            <head>
                <title>${data.companyName} - ${selectedDeck.type}</title>
                <style>
                    @media print { 
                        @page { size: landscape; margin: 0; } 
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body style="margin: 0; background: #eee;">${content}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    if (selectedDeckId && selectedDeck) {
        const currentSlide = selectedDeck.slides[slideIndex];

        return (
            <div className="fixed inset-0 z-50 bg-apex-900 flex flex-col animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-apex-800 bg-apex-900 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedDeckId(null)} className="p-2 hover:bg-apex-800 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Presentation className="w-4 h-4 text-pink-400" />
                                {selectedDeck.title}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                                Slide {slideIndex + 1} of {selectedDeck.slides.length} • {selectedDeck.status === 'completed' ? 'Final Version' : 'Drafting'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                             onClick={() => setShowSidebar(!showSidebar)}
                             className={`p-2 rounded text-xs font-mono border transition-colors ${showSidebar ? 'bg-apex-accent/10 border-apex-accent text-apex-accent' : 'border-apex-800 text-gray-500 hover:text-white'}`}
                             title="Toggle Context Panel"
                        >
                            <Layout className="w-4 h-4" />
                        </button>
                        <div className="h-4 w-px bg-apex-800 mx-2" />
                        <button 
                            onClick={downloadSlide}
                            disabled={!currentSlide.imageUrl}
                            className="flex items-center gap-2 px-3 py-1.5 bg-apex-800 hover:bg-apex-700 text-gray-300 rounded text-xs font-mono transition-colors disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            SAVE IMAGE
                        </button>
                        <button 
                            onClick={handlePrintDeck}
                            className="flex items-center gap-2 px-3 py-1.5 bg-apex-accent hover:bg-apex-accentDim text-black font-bold rounded text-xs font-mono transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            PRINT PDF
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col relative bg-black/50">
                        <div className="flex-1 flex items-center justify-center p-8">
                             <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity z-10">
                                <button onClick={prevSlide} className="p-3 bg-black/50 rounded-full text-white hover:bg-apex-accent hover:text-black transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                             </div>
                             <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity z-10">
                                <button onClick={nextSlide} className="p-3 bg-black/50 rounded-full text-white hover:bg-apex-accent hover:text-black transition-colors">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                             </div>

                             <div className="relative shadow-2xl shadow-black max-w-full max-h-full aspect-video bg-black border border-apex-800 rounded overflow-hidden">
                                {currentSlide.imageUrl ? (
                                    <img src={currentSlide.imageUrl} alt="Slide" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        {selectedDeck.status === 'rendering' ? (
                                            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                                        ) : (
                                            <AlertTriangle className="w-12 h-12 text-gray-700" />
                                        )}
                                        <p className="text-gray-500 font-mono text-xs">
                                            {selectedDeck.status === 'rendering' ? 'Rendering High-Fidelity Asset...' : 'Visual Unavailable'}
                                        </p>
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="h-20 bg-apex-900 border-t border-apex-800 flex items-center gap-2 px-4 overflow-x-auto scrollbar-thin">
                            {selectedDeck.slides.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSlideIndex(idx)}
                                    className={`
                                        relative h-14 aspect-video flex-shrink-0 rounded border overflow-hidden transition-all
                                        ${slideIndex === idx ? 'border-pink-500 ring-1 ring-pink-500 opacity-100' : 'border-apex-700 opacity-50 hover:opacity-100'}
                                    `}
                                >
                                    {s.imageUrl ? (
                                        <img src={s.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-apex-800 flex items-center justify-center text-[8px] text-gray-500">
                                            {idx + 1}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-white px-1">
                                        {idx + 1}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {showSidebar && (
                        <div className="w-80 border-l border-apex-800 bg-apex-900 p-6 overflow-y-auto hidden md:block animate-slide-in-right">
                            <h4 className="text-apex-accent font-bold text-lg mb-6 flex items-start gap-3">
                                <span className="text-gray-600 text-sm font-mono mt-1">0{slideIndex + 1}</span>
                                {currentSlide.title}
                            </h4>
                            
                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-[10px] text-gray-500 uppercase font-mono mb-3 tracking-wider">Key Talking Points</h5>
                                    <ul className="space-y-3">
                                        {currentSlide.contentPoints.map((pt, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                                                <div className="w-1.5 h-1.5 rounded-full bg-apex-700 mt-1.5 flex-shrink-0" />
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-4 bg-apex-800/30 rounded border border-apex-800/50">
                                    <h5 className="text-[10px] text-gray-500 uppercase font-mono mb-2 flex items-center gap-2">
                                        <Palette className="w-3 h-3" />
                                        Visual Directive
                                    </h5>
                                    <p className="text-xs text-gray-500 italic leading-relaxed">
                                        "{currentSlide.visualDirective}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-apex-800/20 p-4 rounded-lg border border-apex-700">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        Marketing Materials & Presentations
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Sienna (Design Director) will generate structure and high-fidelity visuals.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onGenerate?.('Teaser')} 
                        className="px-3 py-1.5 text-xs font-mono bg-apex-900 border border-apex-700 rounded hover:border-pink-500 hover:text-pink-400 transition-colors"
                    >
                        + TEASER (3PG)
                    </button>
                    <button 
                        onClick={() => onGenerate?.('Pitch Deck')} 
                        className="px-3 py-1.5 text-xs font-mono bg-apex-900 border border-apex-700 rounded hover:border-pink-500 hover:text-pink-400 transition-colors"
                    >
                        + PITCH DECK (10PG)
                    </button>
                    <button 
                        onClick={() => onGenerate?.('CIM')} 
                        className="px-3 py-1.5 text-xs font-mono bg-apex-900 border border-apex-700 rounded hover:border-pink-500 hover:text-pink-400 transition-colors"
                    >
                        + CIM (10-15PG)
                    </button>
                </div>
            </div>

            {!data.deliverables?.length ? (
                <div className="text-center py-12 text-gray-500 border border-dashed border-apex-800 rounded-lg">
                    No deliverables generated yet. Request a document above.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {data.deliverables.map(deck => (
                        <div 
                            key={deck.id}
                            onClick={() => { setSelectedDeckId(deck.id); setSlideIndex(0); }}
                            className="group relative cursor-pointer border border-apex-800 hover:border-pink-500/50 rounded-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-pink-900/10"
                        >
                            <div className="aspect-video bg-apex-900 relative">
                                {deck.slides[0]?.imageUrl ? (
                                    <img src={deck.slides[0].imageUrl} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-apex-900 gap-2">
                                        {deck.status !== 'completed' ? (
                                            <>
                                                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                                                <span className="text-[10px] text-gray-600">Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-8 h-8 text-gray-700" />
                                                <span className="text-[10px] text-gray-600">Preview Unavailable</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-12">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">{deck.type}</h4>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{deck.slides.length} Slides</p>
                                        </div>
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center border
                                            ${deck.status === 'completed' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-yellow-900/50 border-yellow-500 text-yellow-400 animate-pulse'}
                                        `}>
                                            {deck.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FinancialsView: React.FC<{ data: DealData }> = ({ data }) => {
    if (!data.financialModels) return <div className="text-center p-8 text-gray-500">Financial models not available.</div>;
    const { years, incomeStatement, balanceSheet, cashFlow } = data.financialModels;

    return (
        <div className="animate-fade-in space-y-2">
            <div className="flex items-center gap-2 mb-4 p-3 bg-apex-800/30 rounded border border-apex-700/50">
                <TableIcon className="w-4 h-4 text-apex-accent" />
                <p className="text-xs text-gray-400">
                    Historical and projected financial statements.
                </p>
            </div>
            <FinancialTable section={incomeStatement} years={years} />
            <FinancialTable section={balanceSheet} years={years} />
            <FinancialTable section={cashFlow} years={years} />
        </div>
    );
};

const LBOView: React.FC<{ data: DealData }> = ({ data }) => {
    if (!data.lboDetailed || !data.financialModels) return <div className="text-center p-8 text-gray-500">LBO Model details not available.</div>;
    const { assumptions, sources, uses, debtSchedule, projectedReturns } = data.lboDetailed;
    const { years } = data.financialModels;
    
    const projectionYears = years.length > 1 ? years.slice(1) : years;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-apex-800/20 border border-apex-800 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-apex-800 pb-2">Key Assumptions</h4>
                    <ul className="space-y-2">
                        {assumptions.map((a, i) => (
                            <li key={i} className="flex justify-between text-xs border-b border-apex-800/50 pb-1 last:border-0">
                                <span className="text-gray-500">{a.label}</span>
                                <span className="font-mono text-apex-accent">{a.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-2 bg-apex-800/20 border border-apex-800 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-apex-800 pb-2">Sources & Uses</h4>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h5 className="text-[10px] font-mono text-emerald-500 uppercase mb-2">Sources</h5>
                            <ul className="space-y-1">
                                {sources.map((s, i) => (
                                    <li key={i} className="flex justify-between text-xs text-gray-400">
                                        <span>{s.label}</span>
                                        <span className="font-mono text-gray-200">{s.value.toFixed(1)}</span>
                                    </li>
                                ))}
                                <li className="flex justify-between text-xs font-bold border-t border-apex-700 mt-2 pt-1">
                                    <span className="text-white">Total Sources</span>
                                    <span className="font-mono text-emerald-400">
                                        {sources.reduce((a, b) => a + b.value, 0).toFixed(1)}
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-[10px] font-mono text-red-400 uppercase mb-2">Uses</h5>
                            <ul className="space-y-1">
                                {uses.map((u, i) => (
                                    <li key={i} className="flex justify-between text-xs text-gray-400">
                                        <span>{u.label}</span>
                                        <span className="font-mono text-gray-200">{u.value.toFixed(1)}</span>
                                    </li>
                                ))}
                                <li className="flex justify-between text-xs font-bold border-t border-apex-700 mt-2 pt-1">
                                    <span className="text-white">Total Uses</span>
                                    <span className="font-mono text-red-400">
                                        {uses.reduce((a, b) => a + b.value, 0).toFixed(1)}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <FinancialTable section={debtSchedule} years={projectionYears} />
                <FinancialTable section={projectedReturns} years={projectionYears} />
            </div>
        </div>
    );
};

const SourcingView: React.FC<{ data: DealData }> = ({ data }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="bg-apex-800/30 border border-apex-700 rounded-lg p-4">
      <h3 className="text-xs text-gray-500 uppercase font-mono mb-4">Opportunity Funnel</h3>
      <div className="space-y-4">
        
        <div className="flex items-center gap-4">
          <div className="w-24 text-right text-xs text-gray-400 font-mono">Market Scan</div>
          <div className="flex-1 bg-apex-800 h-8 rounded relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-blue-900/40 w-full flex items-center px-3 text-xs text-blue-200">
               50+ Companies Screened via Scout Agent
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-24 text-right text-xs text-gray-400 font-mono">Filtered</div>
          <div className="flex-1 bg-apex-800 h-8 rounded relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-purple-900/40 w-[60%] flex items-center px-3 text-xs text-purple-200">
               {data.candidatesAnalyzed?.length || 5} Qualified Candidates
            </div>
          </div>
        </div>

         <div className="flex items-center gap-4">
          <div className="w-24 text-right text-xs text-apex-accent font-mono">Selected</div>
          <div className="flex-1 bg-apex-800 h-8 rounded relative overflow-hidden border border-apex-accent/30">
            <div className="absolute left-0 top-0 h-full bg-apex-accent/20 w-[20%] flex items-center px-3 text-xs text-apex-accent font-bold">
               {data.companyName}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="p-4 border border-apex-700 rounded-lg bg-apex-900/50">
          <h4 className="text-xs text-gray-500 uppercase font-mono mb-2">Rejected Candidates</h4>
          <ul className="space-y-2">
             {data.candidatesAnalyzed?.filter(c => c !== data.companyName).map((c, i) => (
                 <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-900"></div>
                    {c}
                 </li>
             )) || <li className="text-xs text-gray-600 italic">No data available</li>}
          </ul>
       </div>
       <div className="p-4 border border-apex-accent/30 rounded-lg bg-apex-accent/5">
          <h4 className="text-xs text-apex-accent uppercase font-mono mb-2">Why {data.companyName}?</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
             Selected for superior alignment with firm mandate, specifically in EBITDA generation ({data.ebitda}M) and defensive market position in {data.sector}.
          </p>
       </div>
    </div>
  </div>
);

const ValuationView: React.FC<{ data: DealData }> = ({ data }) => {
  const compData = data.comparables?.map(c => ({
    name: c.name,
    multiple: c.multiple,
    isTarget: false
  })) || [];

  const chartData = [
    ...compData,
    { name: data.companyName, multiple: data.askingMultiple, isTarget: true }
  ];

  const hasSensitivityData = data.sensitivityAnalysis && data.sensitivityAnalysis.length > 0 && data.sensitivityAnalysis[0].exits;

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-4 gap-4">
            <MetricBox label="Entry EV/EBITDA" value={`${data.lboModel.entryMultiple}x`} />
            <MetricBox label="Exit EV/EBITDA" value={`${data.lboModel.exitMultiple}x`} />
            <MetricBox label="IRR (5yr)" value={`${data.lboModel.irr}%`} highlight />
            <MetricBox label="MOIC" value={`${data.lboModel.moic}x`} />
        </div>

        {hasSensitivityData && (
            <div className="bg-apex-900 border border-apex-800 rounded-lg p-4 overflow-x-auto">
                <div className="flex items-center gap-2 mb-4">
                    <TableIcon className="w-4 h-4 text-apex-accent" />
                    <h3 className="text-xs font-mono text-gray-400 uppercase">Sensitivity Analysis (IRR %)</h3>
                </div>
                
                <div className="w-full">
                    <div className="flex">
                         <div className="w-24 flex-shrink-0 flex flex-col justify-center text-xs font-mono text-gray-500 text-center font-bold bg-apex-800/50 rounded-l border-y border-l border-apex-700">
                            ENTRY <br/> MULTIPLE
                         </div>
                         <div className="flex-1">
                             <div className="text-center text-xs font-mono text-gray-500 py-1 bg-apex-800/50 border-t border-r border-apex-700 rounded-tr">EXIT MULTIPLE</div>
                             <div className="grid grid-cols-3">
                                 {data.sensitivityAnalysis && data.sensitivityAnalysis[0]?.exits.map((e, i) => (
                                     <div key={i} className="text-center text-xs font-mono text-gray-400 py-1 border-b border-r border-apex-800 bg-apex-800/30">
                                         {e.multiple}x
                                     </div>
                                 ))}
                             </div>
                             {data.sensitivityAnalysis?.map((row, rowIdx) => (
                                 <div key={rowIdx} className="grid grid-cols-3">
                                     {row.exits?.map((col, colIdx) => (
                                        <div 
                                            key={colIdx} 
                                            className={`
                                                text-center py-3 text-sm font-mono border-b border-r border-apex-800 transition-colors hover:bg-white/5
                                                ${col.irr >= 25 ? 'text-emerald-400 bg-emerald-900/10' : col.irr >= 20 ? 'text-yellow-400' : 'text-red-400'}
                                            `}
                                        >
                                            {col.irr}%
                                        </div>
                                     ))}
                                 </div>
                             ))}
                         </div>
                         <div className="w-24 flex-shrink-0 flex flex-col">
                              {data.sensitivityAnalysis?.map((row, i) => (
                                  <div key={i} className="flex-1 flex items-center justify-center text-xs font-mono text-gray-400 border-b border-r border-apex-800 bg-apex-800/30">
                                      {row.entryMultiple}x
                                  </div>
                              ))}
                         </div>
                    </div>
                </div>
            </div>
        )}

        <div className="h-64 bg-apex-800/30 border border-apex-800 rounded-lg p-4">
            <h3 className="text-xs font-mono text-gray-400 uppercase mb-2">Relative Valuation (EV/EBITDA)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" domain={[0, 'auto']} stroke="#666" fontSize={10} />
                <YAxis dataKey="name" type="category" width={100} stroke="#999" fontSize={10} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#333' }}
                  itemStyle={{ color: '#d4af37' }}
                />
                <Bar dataKey="multiple" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isTarget ? '#d4af37' : '#404040'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

const MarketView: React.FC<{ data: DealData }> = ({ data }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-apex-800/30 border border-apex-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-apex-800/50 border-b border-apex-700">
                <h3 className="text-xs font-mono text-gray-400 uppercase">Public Comps Set</h3>
            </div>
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-apex-900/50 font-mono">
                    <tr>
                        <th className="px-4 py-2 font-medium">Company</th>
                        <th className="px-4 py-2 font-medium text-right">EV/EBITDA</th>
                    </tr>
                </thead>
                <tbody>
                    {data.comparables?.map((comp, i) => (
                        <tr key={i} className="border-b border-apex-800 hover:bg-apex-800/30">
                            <td className="px-4 py-2">{comp.name}</td>
                            <td className="px-4 py-2 text-right font-mono text-apex-accentDim">{comp.multiple}x</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 gap-4">
             <h3 className="text-xs font-mono text-gray-400 uppercase">Research Sources</h3>
             <div className="flex flex-wrap gap-2">
                {data.groundingUrls?.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 border border-blue-900/50 px-3 py-2 rounded transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{new URL(url).hostname}</span>
                    </a>
                ))}
             </div>
             {data.location && (
                 <div className="flex items-center gap-2 text-xs text-gray-400 bg-apex-900 p-3 rounded border border-apex-800">
                     <MapPin className="w-4 h-4 text-red-400" />
                     Location Verified: <span className="text-white">{data.location}</span>
                 </div>
             )}
        </div>
    </div>
);

const MetricBox: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className={`p-3 rounded border ${highlight ? 'bg-apex-accent/10 border-apex-accent' : 'bg-apex-800/40 border-apex-700'}`}>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">{label}</div>
        <div className={`text-xl font-bold font-sans ${highlight ? 'text-apex-accent' : 'text-gray-200'}`}>{value}</div>
    </div>
);