import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProps {
  isActive: boolean;
}

const SPEED = 5.0;

export const Player: React.FC<PlayerProps> = ({ isActive }) => {
  const { camera } = useThree();
  const [moveForward, setMoveForward] = useState(false);
  const [moveBackward, setMoveBackward] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          setMoveForward(true);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setMoveLeft(true);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setMoveBackward(true);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setMoveRight(true);
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          setMoveForward(false);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setMoveLeft(false);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setMoveBackward(false);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setMoveRight(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!isActive) return;

    direction.current.z = Number(moveForward) - Number(moveBackward);
    direction.current.x = Number(moveRight) - Number(moveLeft);
    direction.current.normalize(); // Ensure consistent speed in all directions

    if (moveForward || moveBackward) velocity.current.z -= direction.current.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.current.x -= direction.current.x * 400.0 * delta;

    // Movement logic
    const moveZ = velocity.current.z * delta * SPEED;
    const moveX = velocity.current.x * delta * SPEED;

    // This is a simple approximation. PointerLockControls moves the camera directly.
    // We use the controls' methods to move relative to look direction
    if (moveForward) camera.translateZ(-SPEED * delta);
    if (moveBackward) camera.translateZ(SPEED * delta);
    if (moveLeft) camera.translateX(-SPEED * delta);
    if (moveRight) camera.translateX(SPEED * delta);

    // Friction / Damping (Not strictly needed with direct translate, but good for physics-based later)
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;
  });

  return (
    <PointerLockControls 
      makeDefault 
      selector="#root" // Lock pointer when clicking canvas
    />
  );
};
