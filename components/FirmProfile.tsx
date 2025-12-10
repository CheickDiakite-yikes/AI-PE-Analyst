
import React, { useState } from 'react';
import { FirmProfile } from '../types';
import { Save, Building, DollarSign, Globe, Target, MapPin, FileText } from 'lucide-react';

interface FirmProfileProps {
  profile: FirmProfile;
  onSave: (profile: FirmProfile) => void;
}

export const FirmProfileEditor: React.FC<FirmProfileProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<FirmProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof FirmProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleArrayChange = (field: keyof FirmProfile, value: string) => {
    // Split comma-separated string into array
    const array = value.split(',').map(s => s.trim()).filter(s => s !== '');
    setFormData(prev => ({ ...prev, [field]: array }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between border-b border-apex-800 pb-4">
         <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
               <Building className="w-5 h-5 text-apex-accent" />
               Firm Mandate & Configuration
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-1">
               These settings directly control the AI Swarm's search strategy and decision making.
            </p>
         </div>
         <button 
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-apex-accent hover:bg-apex-accentDim text-black font-bold rounded transition-colors"
         >
            <Save className="w-4 h-4" />
            {isSaved ? 'SAVED!' : 'SAVE CHANGES'}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* General Info */}
         <Section title="General Information" icon={<Globe className="w-4 h-4" />}>
            <Input 
                label="Fund Name" 
                value={formData.fundName} 
                onChange={(v) => handleChange('fundName', v)} 
                placeholder="e.g. DiDi Capital"
            />
            <div className="grid grid-cols-2 gap-4">
                <Select 
                    label="Fund Type" 
                    value={formData.fundType} 
                    onChange={(v) => handleChange('fundType', v)} 
                    options={['Private Equity', 'Venture Capital', 'Family Office', 'Hedge Fund', 'Corporate Dev']}
                />
                <Input 
                    label="Fund Size / AUM" 
                    value={formData.fundSize} 
                    onChange={(v) => handleChange('fundSize', v)} 
                    placeholder="e.g. $500M"
                />
            </div>
            <Input 
                label="Website URL" 
                value={formData.website || ''} 
                onChange={(v) => handleChange('website', v)} 
                placeholder="https://..."
            />
         </Section>

         {/* Financial Criteria */}
         <Section title="Financial Criteria" icon={<DollarSign className="w-4 h-4" />}>
             <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Revenue Range" 
                    value={formData.revenueRange} 
                    onChange={(v) => handleChange('revenueRange', v)} 
                    placeholder="e.g. $10M - $100M"
                />
                <Input 
                    label="EBITDA Range" 
                    value={formData.ebitdaRange} 
                    onChange={(v) => handleChange('ebitdaRange', v)} 
                    placeholder="e.g. > $3M"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Check Size Range" 
                    value={formData.checkSize} 
                    onChange={(v) => handleChange('checkSize', v)} 
                    placeholder="e.g. $10M - $50M"
                />
                 <Select 
                    label="Profitability Pref" 
                    value={formData.profitabilityStatus} 
                    onChange={(v) => handleChange('profitabilityStatus', v)} 
                    options={['Profitable', 'Path to Profitability', 'Growth at all costs']}
                />
             </div>
         </Section>

         {/* Strategic Focus */}
         <Section title="Strategic Focus" icon={<Target className="w-4 h-4" />}>
             <Input 
                label="Target Sectors (comma separated)" 
                value={formData.targetSectors.join(', ')} 
                onChange={(v) => handleArrayChange('targetSectors', v)} 
                placeholder="e.g. Healthcare, B2B SaaS, Industrials"
             />
             <Input 
                label="Business Models (comma separated)" 
                value={formData.businessModels.join(', ')} 
                onChange={(v) => handleArrayChange('businessModels', v)} 
                placeholder="e.g. Recurring Revenue, Marketplace"
             />
             <Input 
                label="Geographic Focus" 
                value={formData.geographicFocus.join(', ')} 
                onChange={(v) => handleArrayChange('geographicFocus', v)} 
                placeholder="e.g. North America, Western Europe"
             />
         </Section>

         {/* AI Context Notes */}
         <Section title="AI Analyst Context" icon={<FileText className="w-4 h-4" />}>
            <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">Strategic Notes & Nuances</label>
                <textarea 
                    value={formData.strategicNotes}
                    onChange={(e) => handleChange('strategicNotes', e.target.value)}
                    rows={6}
                    className="w-full bg-apex-900 border border-apex-800 rounded p-3 text-sm text-gray-200 focus:border-apex-accent focus:outline-none transition-colors"
                    placeholder="Enter any specific instructions for the AI agents (e.g. 'We hate cyclical businesses', 'We love founder-led companies', 'Avoid heavy capex')..."
                />
            </div>
         </Section>
      </div>
    </form>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-apex-800/20 border border-apex-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-apex-800 pb-2">
            {icon} {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Input: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-1">
        <label className="text-xs font-mono text-gray-500 uppercase">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full bg-apex-900 border border-apex-800 rounded p-2 text-sm text-gray-200 focus:border-apex-accent focus:outline-none transition-colors"
        />
    </div>
);

const Select: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
        <label className="text-xs font-mono text-gray-500 uppercase">{label}</label>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-apex-900 border border-apex-800 rounded p-2 text-sm text-gray-200 focus:border-apex-accent focus:outline-none transition-colors"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);
