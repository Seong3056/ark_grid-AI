
import React from 'react';
import { User, Search, RefreshCcw, Fingerprint, Sword, Users, TrendingUp } from 'lucide-react';
import { PlayerRole, CharStats, UnifiedEquipment } from '../types';
import UnifiedEquipmentList from '../services/UnifiedEquipmentList';

interface CharacterProfileProps {
  nickname: string;
  setNickname: (val: string) => void;
  role: PlayerRole;
  setRole: (role: PlayerRole) => void;
  charStats: (CharStats & { breakdown: CharStats['breakdown'] }) | null; // Updated line
  loading: boolean;
  onSearch: () => void;
  unifiedEquipment: UnifiedEquipment[];
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ 
  nickname, 
  setNickname, 
  role, 
  setRole, 
  charStats, 
  loading, 
  onSearch,
  unifiedEquipment
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> 캐릭터 정보
        </h2>
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button 
            onClick={() => setRole('dealer')} 
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${role === 'dealer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <Sword className="w-3 h-3 inline mr-1"/>딜러
          </button>
          <button 
            onClick={() => setRole('support')} 
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${role === 'support' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <Users className="w-3 h-3 inline mr-1"/>서폿
          </button>
        </div>
      </div>

      <div>
        <div className="relative mb-4">
          <input 
            type="text" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onSearch()} 
            placeholder="캐릭터 닉네임" 
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-14 text-sm font-bold focus:outline-none focus:border-indigo-500/50" 
          />
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
          <button 
            onClick={onSearch} 
            disabled={loading} 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/50 min-h-[300px] flex flex-col">
          {charStats ? (
            <div className="flex flex-col h-full gap-4">
              <div className="flex justify-between items-center shrink-0">
                <span className="font-bold text-slate-400">전투력</span>
                <span className="font-black text-white text-lg">{charStats.combatPower}</span>
              </div>
              <div className="flex-1 min-h-0">
                <UnifiedEquipmentList data={unifiedEquipment} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-30">
              <TrendingUp className="w-6 h-6 text-slate-600" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">캐릭터 검색이 필요합니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterProfile;
