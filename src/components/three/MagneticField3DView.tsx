import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import type { MagneticField3D } from '../../types';

function FieldLines({ data }: { data: MagneticField3D }) {
  const linesRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (linesRef.current) linesRef.current.rotation.y += dt * 0.05;
  });

  const lineGeometries = useMemo(() => {
    return data.fieldLines.map((line) => {
      const points = [];
      const start = new THREE.Vector3(...line.start);
      const end = new THREE.Vector3(...line.end);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const v = new THREE.Vector3().lerpVectors(start, end, t);
        const r = v.length();
        const phi = Math.atan2(v.y, v.x);
        const theta = Math.acos(v.z / Math.max(r, 0.01));
        const twist = t * Math.PI * 0.5 * (line.strength);
        const newPhi = phi + twist;
        v.x = r * Math.sin(theta) * Math.cos(newPhi);
        v.y = r * Math.sin(theta) * Math.sin(newPhi);
        points.push(v);
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, [data]);

  return (
    <group ref={linesRef}>
      {lineGeometries.map((geo, i) => {
        const strength = data.fieldLines[i].strength;
        const color = new THREE.Color().setHSL(0.7 + strength * 0.1, 0.8, 0.5 + strength * 0.2);
        return (
          <lineSegments key={i} geometry={geo}>
            <lineBasicMaterial color={color} transparent opacity={0.4 + strength * 0.4} />
          </lineSegments>
        );
      })}
    </group>
  );
}

function AccretionDisk() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.3;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.2, 0, 0]}>
      <ringGeometry args={[1.0, 2.8, 64, 4]} />
      <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DensityCloud({ data }: { data: MagneticField3D }) {
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });

  const points = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const [nx, ny, nz] = data.gridDimensions;
    for (let z = 0; z < nz; z += 2) {
      for (let y = 0; y < ny; y += 2) {
        for (let x = 0; x < nx; x += 2) {
          const idx = z * nx * ny + y * nx + x;
          const d = data.densityField[idx];
          if (d > 0.02) {
            const px = ((x / nx) - 0.5) * 6;
            const py = ((y / ny) - 0.5) * 6;
            const pz = ((z / nz) - 0.5) * 4;
            positions.push(px, py, pz);
            const c = new THREE.Color().setHSL(0.08 + d * 0.05, 0.9, 0.4 + d * 0.3);
            colors.push(c.r, c.g, c.b);
          }
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [data]);

  return (
    <points ref={ref} geometry={points}>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Jets() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.children.forEach((c, i) => {
        const scale = 1 + Math.sin(Date.now() * 0.001 + i) * 0.05;
        c.scale.setScalar(scale);
      });
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[0.8, 5, 16, 1, true]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -3.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.8, 5, 16, 1, true]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.05, 0.2, 5, 12, 1, true]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -3, 0]}>
        <cylinderGeometry args={[0.05, 0.2, 5, 12, 1, true]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function MagneticField3DView({ data, height = 400 }: { data: MagneticField3D; height?: number }) {
  return (
    <div style={{ width: '100%', height }} className="overflow-hidden rounded-2xl">
      <Canvas camera={{ position: [0, 2, 6], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={['#050714']} />
        <ambientLight intensity={0.1} />
        <Stars radius={80} depth={30} count={1000} factor={3} fade speed={0.5} />
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.58, 16, 16]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} />
        </mesh>
        <AccretionDisk />
        <FieldLines data={data} />
        <DensityCloud data={data} />
        <Jets />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffaa00" distance={5} />
        <OrbitControls enableZoom enablePan autoRotate autoRotateSpeed={0.4} />
        <EffectComposer>
          <Bloom intensity={1.2} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
