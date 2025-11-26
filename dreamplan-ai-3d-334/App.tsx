import React, { useState, useCallback } from 'react';
import { Upload, Loader2, ArrowLeft, MousePointer2 } from 'lucide-react';
import { World } from './components/Scene/World';
import { AssistantOverlay } from './components/Assistant/AssistantOverlay';
import { analyzeFloorPlan, modifyElement } from './services/geminiService';
import { AppMode, HouseData, SelectionState } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [houseData, setHouseData] = useState<HouseData | null>(null);
  const [selection, setSelection] = useState<SelectionState>({ type: null, id: null });
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Image Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMode(AppMode.LOADING);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; // Remove "data:image/png;base64,"
      
      try {
        const data = await analyzeFloorPlan(base64Data);
        setHouseData(data);
        setMode(AppMode.EXPLORE);
      } catch (error) {
        console.error("Failed to process plan", error);
        alert("Could not analyze the plan. Please try a clearer image.");
        setMode(AppMode.UPLOAD);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Voice Command Modification
  const handleCommand = async (command: string) => {
    if (!selection.type || !houseData) return;

    setIsProcessing(true);
    
    try {
      if (selection.type === 'WALL' && selection.id) {
        const targetWall = houseData.walls.find(w => w.id === selection.id);
        if (targetWall) {
            const updates = await modifyElement({ color: targetWall.color, texture: targetWall.texture }, command, 'WALL');
            
            setHouseData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    walls: prev.walls.map(w => 
                        w.id === selection.id ? { ...w, ...updates } : w
                    )
                };
            });
        }
      } else if (selection.type === 'FLOOR') {
          const updates = await modifyElement({ color: houseData.floor.color, material: houseData.floor.material }, command, 'FLOOR');
          setHouseData(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  floor: { ...prev.floor, ...updates }
              };
          });
      }
    } catch (err) {
        console.error("Failed to modify", err);
    } finally {
        setIsProcessing(false);
    }
  };

  // UI for Upload Screen
  if (mode === AppMode.UPLOAD) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900 z-0"></div>
        
        <div className="z-10 text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6 tracking-tight">
            DreamPlan AI
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-12">
            Upload a 2D floor plan and step inside your future home in seconds. 
            Speak to the AI to redesign walls and floors instantly.
          </p>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <label className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 transition-all cursor-pointer px-12">
              <Upload className="w-16 h-16 text-indigo-400 mb-4" />
              <span className="text-slate-200 font-medium text-lg">Drop your floor plan here</span>
              <span className="text-slate-500 text-sm mt-2">or click to browse files</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // UI for Loading Screen
  if (mode === AppMode.LOADING) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-semibold">Constructing your 3D World...</h2>
        <p className="text-slate-400 mt-2">Gemini AI is analyzing dimensions and structure.</p>
      </div>
    );
  }

  // UI for 3D Exploration
  return (
    <div className="h-screen w-full relative bg-black">
        {houseData && (
          <World 
            houseData={houseData} 
            selection={selection}
            onSelect={setSelection}
          />
        )}
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
            <button 
                onClick={() => setMode(AppMode.UPLOAD)}
                className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 hover:bg-slate-700 transition text-sm text-slate-300"
            >
                <ArrowLeft className="w-4 h-4" />
                Upload New Plan
            </button>

            <div className="bg-slate-900/80 backdrop-blur px-4 py-3 rounded-xl border border-slate-700 text-right">
                <h3 className="text-slate-200 font-semibold text-sm">Controls</h3>
                <div className="text-xs text-slate-400 mt-1 space-y-1">
                    <p><kbd className="bg-slate-700 px-1 rounded">W</kbd> <kbd className="bg-slate-700 px-1 rounded">A</kbd> <kbd className="bg-slate-700 px-1 rounded">S</kbd> <kbd className="bg-slate-700 px-1 rounded">D</kbd> to Walk</p>
                    <p><kbd className="bg-slate-700 px-1 rounded">Click</kbd> to Enter 3D View</p>
                    <p><kbd className="bg-slate-700 px-1 rounded">ESC</kbd> to Show Cursor</p>
                    <p><kbd className="bg-slate-700 px-1 rounded">Click Object</kbd> to Select</p>
                </div>
            </div>
        </div>

        {/* Interaction Center */}
        {selection.type && (
             <AssistantOverlay 
                selectionInfo={selection.type === 'WALL' ? "Selected: Wall" : "Selected: Floor"}
                onCommand={handleCommand}
                isProcessing={isProcessing}
             />
        )}

        {/* Instruction if nothing selected and cursor is free */}
        {!selection.type && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-slate-500 text-sm animate-pulse">
                Click a wall or floor to modify it
            </div>
        )}
    </div>
  );
}

export default App;
