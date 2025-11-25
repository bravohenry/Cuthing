import React from 'react';
import { Save, X } from 'lucide-react';

interface SettingsPanelProps {
  apiKey: string;
  onApiKeyChange: (newKey: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ apiKey, onApiKeyChange, onSave, onClose }) => {
  const handleSaveClick = () => {
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-nothing-card w-[500px] p-8 rounded-[2rem] shadow-2xl border border-nothing-border relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-nothing-bg rounded-full transition-colors"
        >
          <X size={20} className="text-nothing-black" />
        </button>
        <h2 className="text-2xl font-dot mb-8 text-nothing-black">Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block font-bold text-sm text-nothing-black mb-1">
              Google AI Studio API Key
            </label>
            <p className="text-xs text-nothing-grey mb-2">
              Your key is stored locally in your browser. Get one from{' '}
              <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-nothing-black">
                AI Studio
              </a>.
            </p>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="w-full bg-nothing-bg border border-nothing-border rounded-lg px-3 py-2 text-xs font-mono text-nothing-black focus:outline-none focus:border-nothing-black transition-colors"
              placeholder="Paste your API Key here..."
            />
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSaveClick}
            className="px-5 py-2.5 rounded-[1.2rem] bg-nothing-black text-nothing-inverse flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-nothing-red shadow-float border border-transparent"
          >
            <Save className="w-4 h-4" />
            Save and Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
