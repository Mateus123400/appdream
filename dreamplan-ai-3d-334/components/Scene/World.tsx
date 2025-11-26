import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { HouseData, WallData, FloorData, SelectionState } from '../../types';
import { Player } from './Player';

interface WorldProps {
  houseData: HouseData;
  onSelect: (selection: SelectionState) => void;
  selection: SelectionState;
}

// Helper to create geometry from start/end points
const WallSegment: React.FC<{ 
  data: WallData; 
  isSelected: boolean;
  onClick: (e: any) => void; 
}> = ({ data, isSelected, onClick }) => {
  const { start, end, height, thickness, color } = data;
  
  // Calculate length and angle
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  
  // Midpoint for positioning
  const mx = (start.x + end.x) / 2;
  const mz = (start.z + end.z) / 2;

  return (
    <group position={[mx, height / 2, mz]} rotation={[0, -angle, 0]}>
      <mesh onClick={onClick}>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8}
          metalness={0.1}
          emissive={isSelected ? "#4f46e5" : "#000000"}
          emissiveIntensity={isSelected ? 0.5 : 0}
        />
      </mesh>
      {/* Selection Highlight Outline - simplified via slightly larger mesh */}
      {isSelected && (
        <mesh>
           <boxGeometry args={[length + 0.05, height + 0.05, thickness + 0.05]} />
           <meshBasicMaterial color="white" wireframe />
        </mesh>
      )}
    </group>
  );
};

export const World: React.FC<WorldProps> = ({ houseData, onSelect, selection }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Toggle play mode on click (needed for PointerLock)
  const handleCanvasClick = () => {
    setIsPlaying(true);
  };

  const handleWallClick = (e: any, wallId: string) => {
    e.stopPropagation(); // Prevent floor click
    onSelect({ type: 'WALL', id: wallId });
  };

  const handleFloorClick = (e: any) => {
    e.stopPropagation();
    onSelect({ type: 'FLOOR', id: null });
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 10], fov: 60 }}
      onClick={handleCanvasClick}
      className="bg-slate-900"
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} castShadow />
      <Environment preset="sunset" />
      <Sky sunPosition={[100, 20, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Physics/Player */}
      <Player isActive={isPlaying} />

      {/* Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
        onClick={handleFloorClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color={houseData.floor.color} 
          roughness={0.9} 
        />
      </mesh>
      
      {/* Selection Highlight for Floor */}
      {selection.type === 'FLOOR' && (
         <gridHelper args={[100, 100, 0xffffff, 0xffffff]} position={[0, 0.01, 0]} />
      )}

      {/* Walls */}
      {houseData.walls.map((wall) => (
        <WallSegment 
          key={wall.id} 
          data={wall} 
          isSelected={selection.type === 'WALL' && selection.id === wall.id}
          onClick={(e) => handleWallClick(e, wall.id)}
        />
      ))}
      
      {/* Helper Grid only visible when far out or building */}
      <Grid position={[0, -0.01, 0]} args={[10.5, 10.5]} cellColor="#64748b" sectionColor="#94a3b8" infiniteGrid fadeDistance={50} />

    </Canvas>
  );
};
