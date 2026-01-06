
import React from 'react';
import { Settings2, Sun, Moon, Star } from 'lucide-react';
import { CoreType, CoreGrade } from '../types';
import { CORE_TYPES, GRADE_OPTIONS } from '../constants';

interface CoreSettingsProps {
  configs: Record<CoreType, CoreGrade>;
  onChange: (type: CoreType, grade: CoreGrade) => void;
}

const CoreSettings: React.FC<CoreSettingsProps> = ({ configs, onChange }) => {
  const getCoreIcon = (type: string) => {
    if (type.includes('해')) return <Sun className="w-5 h-5 text-orange-400" />;
    if (type.includes('달')) return <Moon className="w-5 h-5 text-indigo-400" />;
    return <Star className="w-5 h-5 text-yellow-300" />;
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-800/50">
      <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Settings2 className="w-4 h-4" /> 코어 설정
      </h2>
      <div className="space-y-3">
        {CORE_TYPES.map(type => (
          <div key={type} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              {getCoreIcon(type)}
              <span className="text-xs font-black text-slate-300">{type}</span>
            </div>
            <select 
              className="bg-slate-900 border border-slate-700 text-[10px] font-black text-indigo-400 px-2 py-1.5 rounded-lg focus:outline-none" 
              value={configs[type]} 
              onChange={(e) => onChange(type, e.target.value as CoreGrade)}
            >
              {GRADE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} (W:{opt.will}, P:{opt.point})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreSettings;
