import React, { useState } from 'react';
import { X, Zap, Key, FileVideo, MessageSquare, Scissors, Download } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onGoToSettings: () => void;
}

const steps = [
  {
    icon: Zap,
    title: 'Welcome to the AI Video Workstation',
    text: 'This is a powerful, private, browser-based video editor. All your files and data stay on your computer.',
  },
  {
    icon: Key,
    title: 'Bring Your Own AI Key',
    text: "To power the AI features, you'll need a free Gemini API Key from Google AI Studio. Let's set that up first.",
  },
  {
    icon: FileVideo,
    title: 'Import Your Media',
    text: 'Click the "Import" button to load a video file from your computer. The analysis will begin automatically.',
  },
  {
    icon: MessageSquare,
    title: 'Edit with Language',
    text: 'Use the chat panel to give commands like "cut out the intro" or "remove the long pause at the beginning."',
  },
    {
    icon: Scissors,
    title: 'Fine-Tune on the Timeline',
    text: 'After an AI edit, you can manually adjust the cuts by dragging the edges of the clips on the timeline.',
  },
  {
    icon: Download,
    title: 'Export Your Video',
    text: 'Once you\'re happy with your edit, click the "Export" button to render the final video directly in your browser.',
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onGoToSettings }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep === 1) { // After API key step
      onGoToSettings();
      onClose(); // Or maybe keep it open? Let's close for now.
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const { icon: Icon, title, text } = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-nothing-card w-[450px] p-8 rounded-[2rem] shadow-2xl border border-nothing-border relative text-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-nothing-bg rounded-full transition-colors"
        >
          <X size={20} className="text-nothing-black" />
        </button>

        <div className="w-16 h-16 bg-nothing-bg rounded-2xl mx-auto mb-6 flex items-center justify-center text-nothing-black border border-nothing-border shadow-sm">
            <Icon size={32} strokeWidth={1.5} />
        </div>

        <h2 className="text-xl font-dot text-nothing-black mb-3">{title}</h2>
        <p className="text-xs text-nothing-grey leading-relaxed mb-8">{text}</p>

        <button
            onClick={handleNext}
            className="w-full py-3 bg-nothing-black text-nothing-inverse rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg"
        >
          {currentStep === 1 ? 'Go to Settings' : currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
