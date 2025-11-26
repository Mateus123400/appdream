export enum AppMode {
  UPLOAD = 'UPLOAD',
  LOADING = 'LOADING',
  EXPLORE = 'EXPLORE',
}

export interface Coordinates {
  x: number;
  z: number; // In 3D space, floor plan Y becomes Z
}

export interface WallData {
  id: string;
  start: Coordinates;
  end: Coordinates;
  height: number;
  thickness: number;
  color: string;
  texture?: string; // 'smooth', 'brick', 'wood'
}

export interface FloorData {
  color: string;
  material: string; // 'wood', 'tile', 'carpet'
}

export interface HouseData {
  walls: WallData[];
  floor: FloorData;
}

export interface SelectionState {
  type: 'WALL' | 'FLOOR' | null;
  id: string | null; // For walls
}
