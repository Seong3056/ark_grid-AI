
import React from 'react';
import { ArkPassive } from '../types/lostark';

interface ArkPassiveProps {
  arkPassive: ArkPassive | null;
}

const ArkPassiveView: React.FC<ArkPassiveProps> = ({ arkPassive }) => {
  if (!arkPassive) {
    return <div className="text-center p-8">캐릭터를 검색해주세요.</div>;
  }

  return (
    <div className="p-4 bg-slate-800/50 rounded-xl">
      <h3 className="font-bold text-lg mb-4">아크 패시브</h3>
      <div className="space-y-2">
        {arkPassive.Effects.map((effect, index) => (
          <div key={index} className="p-3 bg-slate-900/50 rounded-lg">
            <p className="font-bold text-indigo-400">{effect.Name}</p>
            <p className="text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: effect.Description }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArkPassiveView;
