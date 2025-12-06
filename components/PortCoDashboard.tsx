
import React, { useRef, useState } from 'react';
import { PortfolioCompany, FileAttachment } from '../types';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
    Briefcase, Upload, FileSpreadsheet, TrendingUp, DollarSign, 
    Activity, Building2, Calendar, AlertCircle 
} from 'lucide-react';

interface PortCoDashboardProps {
    portfolio: PortfolioCompany[];
    onIngest: (files: FileAttachment[]) => void;
    isProcessing: boolean;
}

export const PortCoDashboard: React.FC<PortCoDashboardProps> = ({ portfolio, onIngest, isProcessing }) => {
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
        <div className="flex flex-col h-full overflow-y-auto p-6 gap-6 animate-fade-in bg-apex-900 text-gray-100">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-apex-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">PORTFOLIO <span className="text-apex-accent">COMMAND</span></h1>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono uppercase tracking-wide">
                        <Briefcase className="w-3 h-3" />
                        FIRM HOLDINGS & BENCHMARKS
                    </div>
                </div>
                <div className="flex gap-2">
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
                        className="flex items-center gap-2 bg-apex-accent hover:bg-apex-accentDim text-black font-bold px-4 py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {isProcessing ? <Activity className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span>INGEST PORTCO DATA</span>
                    </button>
                </div>
            </div>

            {/* Upload Placeholder (if empty) */}
            {portfolio.length === 0 && !isProcessing && (
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
            )}

            {/* Dashboard Content */}
            {portfolio.length > 0 && (
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
                        <div className="bg-apex-800/30 border border-apex-800 rounded-xl p-4 flex flex-col">
                            <h3 className="text-xs font-mono text-gray-400 uppercase mb-4">Sector Exposure</h3>
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sectorData}
                                            innerRadius={60}
                                            outerRadius={80}
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
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {sectorData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span>{entry.name} ({entry.value})</span>
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
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="text-xs text-gray-500 uppercase bg-apex-900 font-mono sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Company</th>
                                            <th className="px-4 py-3 font-medium">Sector</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Rev ($M)</th>
                                            <th className="px-4 py-3 font-medium text-right">EBITDA ($M)</th>
                                            <th className="px-4 py-3 font-medium">Year</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.map((p) => (
                                            <tr key={p.id} className="border-b border-apex-800/50 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                                                <td className="px-4 py-3">{p.sector}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`
                                                        text-[10px] uppercase px-2 py-0.5 rounded font-bold
                                                        ${p.investmentStatus === 'Active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-800 text-gray-500'}
                                                    `}>
                                                        {p.investmentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-300">{p.revenue.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-mono text-apex-accent">{p.ebitda.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.entryDate || "-"}</td>
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
