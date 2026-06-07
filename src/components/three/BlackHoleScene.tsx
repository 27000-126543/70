import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BlackHole({ spin = 0.8 }: { spin?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.15 * spin;
    if (diskRef.current) diskRef.current.rotation.z += dt * 0.4;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.6, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.68, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.06} />
      </mesh>

      <mesh ref={diskRef} rotation={[Math.PI / 2.3, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[1.1, 3.5, 128, 8]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.3, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[0.9, 1.2, 128, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2.3, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[2.8, 3.8, 64, 4]} />
        <meshBasicMaterial color="#ff3b5c" transparent opacity={0.25} />
      </mesh>

      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.08, 0.5, 8, 16, 16, true]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, -4.5, 0]}>
        <cylinderGeometry args={[0.08, 0.5, 8, 16, 16, true]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <coneGeometry args={[0.9, 3, 16, 1, true]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.9, 3, 16, 1, true]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      <pointLight position={[0, 0, 0]} intensity={3} color="#ffaa00" distance={6} />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#22d3ee" distance={8} />
      <pointLight position={[0, -5, 0]} intensity={1.5} color="#22d3ee" distance={8} />
    </group>
  );
}

export default function BlackHoleScene({ spin = 0.8, height = 420 }: { spin?: number; height?: number }) {
  return (
    <div style={{ width: '100%', height }} className="relative overflow-hidden rounded-2xl">
      <Canvas camera={{ position: [0, 2, 7], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={['#050714']} />
        <ambientLight intensity={0.15} />
        <Stars radius={80} depth={40} count={1500} factor={3} fade speed={0.5} />
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <BlackHole spin={spin} />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
        <EffectComposer>
          <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>
      <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-mono z-10">
        a* = {spin.toFixed(3)} · 可拖拽旋转视角
      </div>
    </div>
  );
}
