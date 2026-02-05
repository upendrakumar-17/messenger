import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Configuration variables
const CONFIG = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    positionZ: 5
  },
  renderer: {
    antialias: true,
    alpha: false
  },
  scene: {
    background: 0x000000
  },
  particles: {
    count: 5000,
    sizes: [0.03, 0.05, 0.08],
    color: 0xffffff,
    spread: 10,
    lifespan: 5.0,
    birthRate: 0.02
  },
  box: {
    width: 10,
    height: 10,
    depth: 30,
    color: 0x444444,
    opacity: 0.1,
    wireframe: true
  },
  animation: {
    rotationSpeed: 0.0002,
    waveAmplitude: 0.5,
    waveFrequency: 0.5,
    waveSpeed: 0.005,
    cameraRotationSpeed: 0.0003,
    cameraRadius: 5
  },
  voice: {
    sphereRadii: [4, 4.5, 5, 5.5, 6],
    transitionSpeed: 0.05,
    detectionThreshold: 0.1,
    pauseTime: 5000,
    radiusVariation: 0.9,
    volumeSmoothing: 0.1
  }
};

const DotAnimation = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const isVoiceActiveRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const lastVoiceTimeRef = useRef(0);
  const smoothedVolumeLevelRef = useRef(0);

  useEffect(() => {
    // Store ref value at the start of effect
    const container = containerRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.scene.background);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.camera.near,
      CONFIG.camera.far
    );
    camera.position.z = CONFIG.camera.positionZ;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: CONFIG.renderer.antialias,
      alpha: CONFIG.renderer.alpha
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(CONFIG.particles.count * 3);
    const particlesSizes = new Float32Array(CONFIG.particles.count);
    const particlesLife = new Float32Array(CONFIG.particles.count);
    const particlesOpacity = new Float32Array(CONFIG.particles.count);

    for (let i = 0; i < CONFIG.particles.count * 3; i += 3) {
      particlesPositions[i] = (Math.random() - 0.5) * CONFIG.particles.spread;
      particlesPositions[i + 1] = (Math.random() - 0.5) * CONFIG.particles.spread;
      particlesPositions[i + 2] = (Math.random() - 0.5) * CONFIG.particles.spread;
    }

    for (let i = 0; i < CONFIG.particles.count; i++) {
      const randomSize = CONFIG.particles.sizes[Math.floor(Math.random() * CONFIG.particles.sizes.length)];
      particlesSizes[i] = randomSize;
      particlesLife[i] = Math.random() * CONFIG.particles.lifespan;
      particlesOpacity[i] = 0;
    }

    // Store original positions and target sphere positions
    const originalPositions = new Float32Array(particlesPositions);
    const targetPositions = new Float32Array(CONFIG.particles.count * 3);
    const sphereAssignment = new Float32Array(CONFIG.particles.count);

    // Assign particles to spheres and calculate target positions
    const particlesPerSphere = Math.floor(CONFIG.particles.count / CONFIG.voice.sphereRadii.length);
    for (let i = 0; i < CONFIG.particles.count; i++) {
      const sphereIndex = Math.min(Math.floor(i / particlesPerSphere), CONFIG.voice.sphereRadii.length - 1);
      sphereAssignment[i] = sphereIndex;
      
      // Calculate position on sphere
      const radius = CONFIG.voice.sphereRadii[sphereIndex];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      targetPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      targetPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      targetPositions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particlesSizes, 1));
    particlesGeometry.setAttribute('life', new THREE.BufferAttribute(particlesLife, 1));
    particlesGeometry.setAttribute('opacity', new THREE.BufferAttribute(particlesOpacity, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(CONFIG.particles.color) }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 100.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(color, vOpacity);
        }
      `,
      transparent: true
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create bounding box
    const boxGeometry = new THREE.BoxGeometry(CONFIG.box.width, CONFIG.box.height, CONFIG.box.depth);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.box.color,
      wireframe: CONFIG.box.wireframe,
      transparent: true,
      opacity: CONFIG.box.opacity
    });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(boxMesh);

    // Setup voice detection
    const setupVoiceDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    };
    
    setupVoiceDetection();

    // Animation time tracker
    let time = 0;
    let cameraAngle = 0;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      time += CONFIG.animation.waveSpeed;
      cameraAngle += CONFIG.animation.cameraRotationSpeed;

      // Voice detection
      let currentVoiceDetected = false;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = average / 255;
        
        // Smooth the volume level
        smoothedVolumeLevelRef.current += (normalized - smoothedVolumeLevelRef.current) * CONFIG.voice.volumeSmoothing;
        
        currentVoiceDetected = normalized > CONFIG.voice.detectionThreshold;
        
        // Debug logging (remove in production)
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
          console.log('Voice level:', normalized.toFixed(3), 'Smoothed:', smoothedVolumeLevelRef.current.toFixed(3), 'Active:', isVoiceActiveRef.current);
        }
        
        if (currentVoiceDetected) {
          lastVoiceTimeRef.current = Date.now();
          isVoiceActiveRef.current = true;
        } else {
          // Check if pause time has elapsed
          const timeSinceLastVoice = Date.now() - lastVoiceTimeRef.current;
          if (timeSinceLastVoice > CONFIG.voice.pauseTime) {
            isVoiceActiveRef.current = false;
          }
        }
      }

      // Smooth camera motion
      camera.position.x = Math.sin(cameraAngle) * CONFIG.animation.cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * CONFIG.animation.cameraRadius;
      camera.lookAt(0, 0, 0);

      // Particle animation
      const positions = particlesGeometry.attributes.position.array;
      const life = particlesGeometry.attributes.life.array;
      const opacity = particlesGeometry.attributes.opacity.array;

      for (let i = 0; i < CONFIG.particles.count; i++) {
        const i3 = i * 3;
        
        if (isVoiceActiveRef.current) {
          // Calculate volume-based radius scaling (-30% to +30%)
          const volumeScale = 1.0 + (smoothedVolumeLevelRef.current * 2 - 1) * CONFIG.voice.radiusVariation;
          
          // Scale target positions based on volume
          const scaledTargetX = targetPositions[i3] * volumeScale;
          const scaledTargetY = targetPositions[i3 + 1] * volumeScale;
          const scaledTargetZ = targetPositions[i3 + 2] * volumeScale;
          
          // Move towards scaled sphere positions
          positions[i3] += (scaledTargetX - positions[i3]) * CONFIG.voice.transitionSpeed;
          positions[i3 + 1] += (scaledTargetY - positions[i3 + 1]) * CONFIG.voice.transitionSpeed;
          positions[i3 + 2] += (scaledTargetZ - positions[i3 + 2]) * CONFIG.voice.transitionSpeed;
        } else {
          // Move towards original positions with wave animation
          const targetX = originalPositions[i3];
          const targetZ = originalPositions[i3 + 2];
          const waveY = Math.sin(targetX * CONFIG.animation.waveFrequency + time) * CONFIG.animation.waveAmplitude +
                        Math.cos(targetZ * CONFIG.animation.waveFrequency + time) * CONFIG.animation.waveAmplitude;
          
          positions[i3] += (targetX - positions[i3]) * CONFIG.voice.transitionSpeed;
          positions[i3 + 1] += (waveY - positions[i3 + 1]) * CONFIG.voice.transitionSpeed;
          positions[i3 + 2] += (targetZ - positions[i3 + 2]) * CONFIG.voice.transitionSpeed;
        }

        // Update life cycle
        life[i] += CONFIG.particles.birthRate;
        
        if (life[i] > CONFIG.particles.lifespan) {
          life[i] = 0;
        }

        // Calculate opacity based on life (fade in and fade out)
        const lifeProgress = life[i] / CONFIG.particles.lifespan;
        if (lifeProgress < 0.2) {
          opacity[i] = lifeProgress / 0.2;
        } else if (lifeProgress > 0.8) {
          opacity[i] = (1.0 - lifeProgress) / 0.2;
        } else {
          opacity[i] = 1.0;
        }
      }

      particlesGeometry.attributes.position.needsUpdate = true;
      particlesGeometry.attributes.life.needsUpdate = true;
      particlesGeometry.attributes.opacity.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default DotAnimation;