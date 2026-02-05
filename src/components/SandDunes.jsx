import React, { useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ===================== SHADERS ===================== */

const vertexShader = `
  uniform float uTime;

  varying float vE1;
  varying float vE2;
  varying float vE3;

  void main() {
    vec3 pos = position;

    float wave1 = sin(pos.x * 0.35 + uTime * 0.6) * 0.8;
    float wave2 = sin(pos.z * 0.25 + uTime * 0.4) * 1.2;
    float wave3 = sin((pos.x + pos.z) * 0.15 + uTime * 0.3) * 0.6;

    pos.y += wave1 + wave2 + wave3;

    // Use absolute energy, not signed height
    vE1 = abs(wave1);
    vE2 = abs(wave2);
    vE3 = abs(wave3);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    gl_PointSize = 5.1 * (10.0 / -mvPosition.z);
    
  }
`;


const fragmentShader = `
  precision highp float;

  varying float vE1;
  varying float vE2;
  varying float vE3;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;

    // Sharpen wave identities
    float w1 = pow(vE1, 1.3);
    float w2 = pow(vE2, 1.3);
    float w3 = pow(vE3, 1.3);

    // Distinct but harmonious palette
    vec3 color1 = vec3(0.95, 0.85, 0.65); // warm sand
    vec3 color2 = vec3(0.75, 0.82, 0.90); // cool mineral
    vec3 color3 = vec3(0.90, 0.70, 0.50); // amber ridge

    vec3 color =
      color1 * w1 +
      color2 * w2 +
      color3 * w3;

    // Gentle compression to avoid blowout
    color = color / (max(max(w1, w2), w3) + 0.6);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ===================== PARTICLE FIELD ===================== */

function ParticleField() {
  const countX = 500;
  const countZ = 500;
  const total = countX * countZ;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(total * 3);

    let i = 0;
    for (let x = 0; x < countX; x++) {
      for (let z = 0; z < countZ; z++) {
        positions[i++] = (x - countX / 2) * 0.2;
        positions[i++] = 0;
        positions[i++] = (z - countZ / 2) * 0.2;
      }
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [total]);

  const material = useMemo(
  () =>
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAudio: { value: 0 }, // <--- new uniform for audio
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    }),
  []
);

useEffect(() => {
  let audioCtx, analyser, dataArray;

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);

    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  });

  const tick = () => {
    if (analyser && dataArray) {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      material.uniforms.uAudio.value = volume; // feed volume into shader
    }
    requestAnimationFrame(tick);
  };
  tick();
}, []);


  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} />;
}

/* ===================== MAIN COMPONENT ===================== */

export default function ParticleWaveTriColor() {
  return (
    <Canvas
      camera={{ position: [15, 3, 22], fov: 60 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{
        width: "100%",
        height: "100vh",
        background: "radial-gradient(#1a1a1a, #0b0b0b)",
      }}
    >
      <ParticleField />
    </Canvas>
  );
}
