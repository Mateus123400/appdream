import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Wand2, X, MessageSquare } from 'lucide-react';

interface AssistantOverlayProps {
  selectionInfo: string | null; // e.g., "Wall selected"
  onCommand: (command: string) => void;
  isProcessing: boolean;
}

export const AssistantOverlay: React.FC<AssistantOverlayProps> = ({ 
  selectionInfo, 
  onCommand,
  isProcessing 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);

  // Simple Speech Recognition Setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; // Portuguese Brazil based on prompt language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setTranscript("Listening...");

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onCommand(text);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setTranscript("Error listening. Try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!selectionInfo) return null;

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-slate-200">AI Architect</span>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
            {selectionInfo}
          </span>
        </div>

        <div className="relative">
            <div className={`p-3 rounded-lg border text-sm min-h-[60px] flex items-center justify-center transition-colors ${
              isProcessing ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
               {isProcessing ? (
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150" />
                    <span>Analyzing Request...</span>
                 </div>
               ) : (
                 transcript || "Select an object and tap the microphone to describe changes..."
               )}
            </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={toggleListening}
            disabled={!supported || isProcessing}
            className={`
              relative group flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all
              ${isListening 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 animate-pulse" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Speak Instruction</span>
              </>
            )}
            
            {!supported && <span className="absolute -top-10 bg-black text-white text-xs p-1 rounded">Mic not supported</span>}
          </button>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-3">
           Try: "Change this wall to red brick" or "Make the floor wooden"
        </p>
      </div>
    </div>
  );
};
