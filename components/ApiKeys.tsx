
import React, { useState, useEffect } from 'react';
import { KeyRound, BrainCircuit } from 'lucide-react';

interface ApiKeysProps {
  lostArkApiKey: string;
  setLostArkApiKey: (key: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
}

const ApiKeys: React.FC<ApiKeysProps> = ({ 
  lostArkApiKey, setLostArkApiKey, 
  geminiApiKey, setGeminiApiKey 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lostArkApiKey) {
      localStorage.setItem('lostArkApiKey', lostArkApiKey);
    }
    if (geminiApiKey) {
      localStorage.setItem('geminiApiKey', geminiApiKey);
    }
  }, [lostArkApiKey, geminiApiKey]);
  
  return (
    <div className="mt-4">
      <button onClick={() => setShow(!show)} className="text-xs text-slate-500 hover:text-slate-400 font-bold flex items-center gap-2">
        <KeyRound className="w-4 h-4" />
        <span>API 키 설정</span>
      </button>
      {show && (
        <div className="mt-4 space-y-3 p-4 bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            <label htmlFor="lostark-key" className="flex-shrink-0 text-xs font-bold text-slate-400 flex items-center gap-2">
              <img src="https://img.lostark.co.kr/common/icon/favicon.ico" alt="Lost Ark" className="w-4 h-4 rounded-full" />
              Lost Ark
            </label>
            <input
              id="lostark-key"
              type="password"
              value={lostArkApiKey}
              onChange={(e) => setLostArkApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Lost Ark API Key"
            />
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="gemini-key" className="flex-shrink-0 text-xs font-bold text-slate-400 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              Gemini
            </label>
            <input
              id="gemini-key"
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Google Gemini API Key"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
