'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function FloatingParticles() {
    const count = 50;
    const mesh = useRef<THREE.InstancedMesh>(null);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                position: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10],
                scale: Math.random() * 0.5 + 0.1,
                speed: Math.random() * 0.5 + 0.2,
            });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = state.clock.getElapsedTime();

        particles.forEach((particle, i) => {
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3(
                particle.position[0] + Math.sin(time * particle.speed + i) * 0.5,
                particle.position[1] + Math.cos(time * particle.speed + i) * 0.5,
                particle.position[2]
            );
            matrix.setPosition(position);
            matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
            mesh.current!.setMatrixAt(i, matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#FBBF24" transparent opacity={0.6} />
        </instancedMesh>
    );
}

function GlowingSphere() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={meshRef}>
                <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                <meshStandardMaterial color="#FBBF24" wireframe transparent opacity={0.3} />
            </mesh>
        </Float>
    );
}

function Scene() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#FBBF24" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F59E0B" />
            <FloatingParticles />
            <GlowingSphere />
        </>
    );
}

export function ThreeBackground() {
    return (
        <div className="absolute inset-0 -z-10 opacity-40">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                <Scene />
            </Canvas>
        </div>
    );
}
