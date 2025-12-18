
import React from 'react';
import { DealRoom, DealStage } from '../types';
import { 
    Plus, Search, ArrowRight, LayoutGrid, List, MoreHorizontal, 
    TrendingUp, DollarSign, PieChart, Clock, Building2, Filter
} from 'lucide-react';

interface PipelineDashboardProps {
    deals: DealRoom[];
    onSelectDeal: (dealId: string) => void;
    onCreateDeal: () => void;
}

export const PipelineDashboard: React.FC<PipelineDashboardProps> = ({ deals, onSelectDeal, onCreateDeal }) => {
    // Analytics
    const totalPipelineValue = deals.reduce((acc, deal) => acc + (deal.data.impliedValue || 0), 0);
    const activeDeals = deals.filter(d => d.stage !== 'Closed' && d.stage !== 'Passed').length;
    
    const dealsByStage = {
        Sourcing: deals.filter(d => d.stage === 'Sourcing').length,
        Screening: deals.filter(d => d.stage === 'Screening').length,
        Diligence: deals.filter(d => d.stage === 'Diligence').length,
        IC: deals.filter(d => d.stage === 'IC Review').length,
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-apex-900">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <MetricCard 
                    label="Active Deal Rooms" 
                    value={activeDeals.toString()} 
                    icon={<LayoutGrid className="w-5 h-5 text-apex-accent" />}
                    trend="+2 this week"
                />
                <MetricCard 
                    label="Pipeline EV (Implied)" 
                    value={`$${(totalPipelineValue).toLocaleString()}M`} 
                    icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                />
                <MetricCard 
                    label="Diligence Phase" 
                    value={dealsByStage.Diligence.toString()} 
                    icon={<Search className="w-5 h-5 text-blue-400" />}
                />
                <button 
                    onClick={onCreateDeal}
                    className="flex flex-col items-center justify-center p-4 bg-apex-accent hover:bg-apex-accentDim rounded-xl transition-all group shadow-lg shadow-apex-accent/10 cursor-pointer border border-transparent hover:border-white/20"
                >
                    <div className="p-2 bg-black/20 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-sm font-bold text-black uppercase tracking-wide">New Deal Room</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-apex-800/20 border border-apex-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-apex-800 flex justify-between items-center bg-apex-900/50">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <List className="w-4 h-4 text-gray-500" /> Active Deals
                    </h2>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-apex-800 rounded text-gray-500">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    {deals.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50">
                            <LayoutGrid className="w-16 h-16" />
                            <p className="text-sm font-mono uppercase">Pipeline Empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {deals.map(deal => (
                                <DealCard key={deal.id} deal={deal} onClick={() => onSelectDeal(deal.id)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode; trend?: string }> = ({ label, value, icon, trend }) => (
    <div className="bg-apex-800/30 border border-apex-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-500 font-mono uppercase">{label}</span>
            <div className="p-2 bg-apex-900 rounded-lg border border-apex-800/50">
                {icon}
            </div>
        </div>
        <div>
            <span className="text-2xl font-bold text-white block">{value}</span>
            {trend && <span className="text-[10px] text-emerald-500 font-mono">{trend}</span>}
        </div>
    </div>
);

const DealCard: React.FC<{ deal: DealRoom; onClick: () => void }> = ({ deal, onClick }) => {
    const getStageColor = (stage: DealStage) => {
        switch (stage) {
            case 'Sourcing': return 'text-purple-400 bg-purple-900/20 border-purple-900/50';
            case 'Screening': return 'text-blue-400 bg-blue-900/20 border-blue-900/50';
            case 'Diligence': return 'text-apex-accent bg-apex-accent/10 border-apex-accent/30';
            case 'IC Review': return 'text-orange-400 bg-orange-900/20 border-orange-900/50';
            case 'Closed': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/50';
            default: return 'text-gray-400 bg-gray-800 border-gray-700';
        }
    };

    return (
        <div 
            onClick={onClick}
            className="group relative bg-apex-900 border border-apex-800 hover:border-apex-accent/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-2xl hover:shadow-apex-accent/5 overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-apex-800 flex items-center justify-center border border-apex-700 font-bold text-gray-300 group-hover:text-white transition-colors">
                        {deal.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-apex-accent transition-colors">{deal.title}</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{deal.data.sector || "Unknown Sector"}</p>
                    </div>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded border font-mono uppercase font-bold ${getStageColor(deal.stage)}`}>
                    {deal.stage}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-apex-800/50 py-3">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase mb-0.5">EBITDA (LTM)</p>
                    <p className="text-sm font-mono text-gray-200">${(deal.data.ebitda || 0).toFixed(1)}M</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase mb-0.5">Implied EV</p>
                    <p className="text-sm font-mono text-gray-200">${(deal.data.impliedValue || 0).toFixed(1)}M</p>
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {new Date(deal.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 group-hover:text-white transition-colors">
                    <span>Enter Room</span>
                    <ArrowRight className="w-3 h-3" />
                </div>
            </div>
            
            {/* Hover Glow Effect */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-apex-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
    );
};
