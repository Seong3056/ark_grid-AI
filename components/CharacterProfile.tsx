
import React from 'react';
import { User, Search, RefreshCcw, Fingerprint, Sword, Users, TrendingUp } from 'lucide-react';
import { PlayerRole, CharStats } from '../types';
import StatWithTooltip from './StatWithTooltip';

interface CharacterProfileProps {
  nickname: string;
  setNickname: (val: string) => void;
  role: PlayerRole;
  setRole: (role: PlayerRole) => void;
  charStats: (CharStats & { breakdown: CharStats['breakdown'] }) | null; // Updated line
  loading: boolean;
  onSearch: () => void;
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ 
  nickname, 
  setNickname, 
  role, 
  setRole, 
  charStats, 
  loading, 
  onSearch 
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

        <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/50 min-h-[100px] flex flex-col justify-center">
          {charStats ? (
            <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400">전투력 :</span>
              <span className="font-black text-white">{charStats.combatPower}</span>
            </div>
            <StatWithTooltip 
              label="공격력 :" 
              value={charStats.attackPower} 
              sources={charStats.breakdown.attackPower} 
            />
            <StatWithTooltip 
              label="무기 공격력 :" 
              value={charStats.weaponAtkPower} 
              sources={charStats.breakdown.weaponAtkPower} 
            />
            <StatWithTooltip 
              label="추가피해:" 
              value={charStats.additionalDamage} 
              sources={charStats.breakdown.additionalDamage} 
            />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400">치명타 적중률:</span>
              <span className="font-black text-white">{charStats.critRate}</span>
            </div>
            <div className="text-right text-[10px] text-slate-500/80 -mt-1">
              (치명스탯+아크패시브 치명타 적중률+각인(아드레날린, 정밀단도)+반지 연마효과, 팔찌 효과)
            </div>
            <StatWithTooltip 
              label="낙인력 :" 
              value={charStats.branding} 
              sources={charStats.breakdown.branding} 
            />
            <StatWithTooltip 
              label="아군 공격 강화 :" 
              value={charStats.atkBuff} 
              sources={charStats.breakdown.atkBuff} 
            />
            <StatWithTooltip 
              label="아군 피해 강화 :" 
              value={charStats.dmgBuff} 
              sources={charStats.breakdown.dmgBuff} 
            />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400">치명타 피해량(합연산):</span>
              <span className="font-black text-white"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400">치명타 적중시 피해량(곱연산):</span>
              <span className="font-black text-white"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400">적에게 주는 피해량(곱연산):</span>
              <span className="font-black text-white"></span>
            </div>
          </div>
          ) : (
            <div className="text-center py-2 flex flex-col items-center gap-2 opacity-30">
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
