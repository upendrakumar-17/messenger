import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

// Create a custom shader material
const ParticleMaterial = shaderMaterial(
  { uTime: 0, uAudio: 0 },
  // Vertex Shader
  `
  precision highp float;
  uniform float uTime;
  uniform float uAudio;
  attribute float aRandom;
  varying vec3 vColor;

  // Simple noise function
  float noise(in vec3 p) {
    return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453123);
  }

  void main() {
    vec3 pos = position;
    float n = noise(pos + uTime * 0.5 + aRandom*10.0);
    vec3 displaced = pos + normal * n * 0.5 * uAudio;
    vColor = vec3(0.3 + 0.7*uAudio, 0.2, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    gl_PointSize = 2.5 + uAudio * 8.0;
  }
  `,
  // Fragment Shader
  `
  precision highp float;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    vec3 color = vColor * vec3(0.2, 0.4, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
  `
);

extend({ ParticleMaterial });

const ParticleSphere = () => {
  const materialRef = useRef();
  const { size } = useThree();

  // Setup microphone input
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 512;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      materialRef.current.audioAnalyser = analyser;
      materialRef.current.audioData = dataArray;
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    materialRef.current.uTime = t;

    if (materialRef.current.audioAnalyser) {
      materialRef.current.audioAnalyser.getByteFrequencyData(
        materialRef.current.audioData
      );
      const sum = materialRef.current.audioData.reduce((a, b) => a + b, 0);
      materialRef.current.uAudio =
        sum / (materialRef.current.audioData.length * 255);
    }
  });

  // Sphere geometry for particles
  const sphere = new THREE.SphereGeometry(5, 128, 128);
  const positions = Array.from(sphere.attributes.position.array);
  const count = positions.length / 3;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "aRandom",
    new THREE.Float32BufferAttribute(
      new Array(count).fill().map(() => Math.random()),
      1
    )
  );

  return (
    <points geometry={geometry}>
      <particleMaterial ref={materialRef} />
    </points>
  );
};

const NeonParticleSphere = () => {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <ambientLight intensity={0.3} />
      <ParticleSphere />
      <color attach="background" args={["#000"]} />
    </Canvas>
  );
};

export default NeonParticleSphere;
