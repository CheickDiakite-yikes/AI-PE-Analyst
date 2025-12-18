
import React, { useRef, useState } from 'react';
import { PortfolioCompany, FileAttachment, FirmProfile } from '../types';
import { FirmProfileEditor } from './FirmProfile';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
    Briefcase, Upload, FileSpreadsheet, TrendingUp, DollarSign, 
    Activity, Building2, LayoutGrid, Settings, Users, Percent
} from 'lucide-react';

interface PortCoDashboardProps {
    portfolio: PortfolioCompany[];
    firmProfile: FirmProfile;
    onIngest: (files: FileAttachment[]) => void;
    onUpdateProfile: (profile: FirmProfile) => void;
    isProcessing: boolean;
}

type Tab = 'holdings' | 'mandate';

export const PortCoDashboard: React.FC<PortCoDashboardProps> = ({ portfolio, firmProfile, onIngest, onUpdateProfile, isProcessing }) => {
    const [activeTab, setActiveTab] = useState<Tab>('holdings');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Analytics ---
    const totalEbitda = portfolio.reduce((acc, curr) => acc + curr.ebitda, 0);
    const totalRevenue = portfolio.reduce((acc, curr) => acc + curr.revenue, 0);
    const activeCount = portfolio.filter(p => p.investmentStatus === 'Active').length;

    // Sector Chart Data
    const sectorMap = new Map<string, number>();
    portfolio.forEach(p => {
        sectorMap.set(p.sector, (sectorMap.get(p.sector) || 0) + 1);
    });
    const sectorData = Array.from(sectorMap).map(([name, value]) => ({ name, value }));
    const COLORS = ['#d4af37', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

    // --- Handlers ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files: FileAttachment[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const reader = new FileReader();
                const result = await new Promise<string>(resolve => {
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.readAsDataURL(file);
                });
                files.push({ name: file.name, type: file.type, data: result });
            }
            onIngest(files);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-apex-900 text-gray-100">
            
            {/* Header with Tabs */}
            <div className="flex-shrink-0 px-6 pt-6 pb-2 border-b border-apex-800 bg-apex-900 z-20">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">PORTFOLIO <span className="text-apex-accent">COMMAND</span></h1>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono uppercase tracking-wide">
                            <Briefcase className="w-3 h-3" />
                            FIRM INTELLIGENCE & CONFIGURATION
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('holdings')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-colors ${activeTab === 'holdings' ? 'border-apex-accent text-apex-accent' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        HOLDINGS & DATA
                    </button>
                    <button 
                         onClick={() => setActiveTab('mandate')}
                         className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-colors ${activeTab === 'mandate' ? 'border-apex-accent text-apex-accent' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        <Settings className="w-4 h-4" />
                        FIRM MANDATE
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {activeTab === 'mandate' ? (
                    <FirmProfileEditor profile={firmProfile} onSave={onUpdateProfile} />
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Ingestion Button (Holdings Only) */}
                        <div className="flex justify-end">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange} 
                                className="hidden"
                                accept=".csv,.xlsx,.pdf" 
                                multiple
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="flex items-center gap-2 bg-apex-800 hover:bg-apex-700 border border-apex-700 text-gray-300 font-bold px-4 py-2 rounded transition-colors disabled:opacity-50 text-xs font-mono"
                            >
                                {isProcessing ? <Activity className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span>INGEST PORTCO DATA</span>
                            </button>
                        </div>

                        {/* Upload Placeholder (if empty) */}
                        {portfolio.length === 0 && !isProcessing ? (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-apex-800 rounded-xl p-12 bg-apex-800/10">
                                <FileSpreadsheet className="w-16 h-16 text-apex-800 mb-4" />
                                <h3 className="text-xl font-bold text-gray-400 mb-2">No Portfolio Data Loaded</h3>
                                <p className="text-sm text-gray-500 max-w-md text-center mb-6">
                                    Upload CSV, Excel, or PDF exports from your fund admin or data room. 
                                    The Diligence Agent will standardize the data automatically.
                                </p>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-apex-accent hover:underline text-sm font-mono uppercase"
                                >
                                    Select Files to Upload
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard 
                                        label="Active Investments" 
                                        value={activeCount.toString()} 
                                        icon={<Building2 className="w-5 h-5 text-blue-400" />} 
                                    />
                                    <StatCard 
                                        label="Aggregate Revenue (LTM)" 
                                        value={`$${totalRevenue.toLocaleString()}M`} 
                                        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} 
                                    />
                                    <StatCard 
                                        label="Aggregate EBITDA (LTM)" 
                                        value={`$${totalEbitda.toLocaleString()}M`} 
                                        icon={<DollarSign className="w-5 h-5 text-apex-accent" />} 
                                    />
                                </div>

                                {/* Charts & Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
                                    
                                    {/* Sector Allocation */}
                                    <div className="bg-apex-800/30 border border-apex-800 rounded-xl p-4 flex flex-col h-64">
                                        <h3 className="text-xs font-mono text-gray-400 uppercase mb-4">Sector Exposure</h3>
                                        <div className="flex-1 min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={sectorData}
                                                        innerRadius={40}
                                                        outerRadius={60}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {sectorData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#171717', borderColor: '#333' }}
                                                        itemStyle={{ color: '#d4af37' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {sectorData.map((entry, index) => (
                                                <div key={index} className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="truncate">{entry.name} ({entry.value})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="lg:col-span-2 bg-apex-800/30 border border-apex-800 rounded-xl overflow-hidden flex flex-col">
                                        <div className="p-4 border-b border-apex-800 bg-apex-900/50 flex justify-between items-center">
                                            <h3 className="text-xs font-mono text-gray-400 uppercase">Portfolio Companies</h3>
                                            <span className="text-[10px] text-gray-600 font-mono">{portfolio.length} RECORDS</span>
                                        </div>
                                        <div className="flex-1 overflow-auto scrollbar-thin">
                                            <table className="w-full text-left text-sm text-gray-400 whitespace-nowrap">
                                                <thead className="text-xs text-gray-500 uppercase bg-apex-900 font-mono sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Company</th>
                                                        <th className="px-4 py-3 font-medium">Sector</th>
                                                        <th className="px-4 py-3 font-medium">Fund</th>
                                                        <th className="px-4 py-3 font-medium">Own %</th>
                                                        <th className="px-4 py-3 font-medium text-right">Rev ($M)</th>
                                                        <th className="px-4 py-3 font-medium text-right">EBITDA ($M)</th>
                                                        <th className="px-4 py-3 font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {portfolio.map((p) => (
                                                        <tr key={p.id} className="border-b border-apex-800/50 hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-white">
                                                                {p.name}
                                                                {p.boardSeats ? <span className="ml-2 text-[9px] bg-apex-700 px-1 py-0.5 rounded text-gray-300" title="Board Seats">{p.boardSeats} Seats</span> : null}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {p.sector}
                                                                {p.subsector && <span className="block text-[10px] text-gray-500">{p.subsector}</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs">{p.fund || "-"}</td>
                                                            <td className="px-4 py-3 text-xs font-mono text-apex-accentDim">
                                                                {p.ownershipPercentage ? `${(p.ownershipPercentage * 100).toFixed(1)}%` : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono text-gray-300">{p.revenue.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-apex-accent">{p.ebitda.toLocaleString()}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`
                                                                    text-[10px] uppercase px-2 py-0.5 rounded font-bold
                                                                    ${p.investmentStatus === 'Active' ? 'bg-emerald-900/30 text-emerald-400' : 
                                                                      p.investmentStatus === 'Exited' ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 text-gray-500'}
                                                                `}>
                                                                    {p.investmentStatus}
                                                                </span>
                                                                {p.exitDate && <span className="block text-[9px] text-gray-500 mt-0.5">Exit: {p.exitDate}</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-apex-800/30 border border-apex-800 rounded-xl p-4 flex items-center justify-between">
        <div>
            <p className="text-xs text-gray-500 font-mono uppercase mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="p-3 bg-apex-900 rounded-lg border border-apex-800">
            {icon}
        </div>
    </div>
);
