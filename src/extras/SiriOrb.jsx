import React, { useEffect, useRef } from "react";

/**
 * SiriOrb Pro
 * High‑fidelity Siri‑style fluid orb background with layered gradient waves.
 * Designed for voice assistants and real‑time audio visualization.
 *
 * Props:
 * size = 420
 * audioLevel = 0.2        // 0‑1 realtime microphone energy
 * speed = 0.015
 * colors = ["#4f9cff", "#7c3aed", "#22d3ee", "#38bdf8"]
 * layers = 4
 */
export default function SiriOrb({
  size = 420,
  audioLevel = 0.2,
  speed = 0.015,
  colors = ["#4f9cff", "#7c3aed", "#22d3ee", "#38bdf8"],
  layers = 4,
}) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    let t = 0;

    const drawLayer = (index) => {
      const cx = size / 2;
      const cy = size / 2;
      const baseRadius = size * (0.18 + index * 0.03);

      const amp = 18 + audioLevel * 60 * (1 + index * 0.2);
      const phase = t * (1 + index * 0.2);

      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const wave = Math.sin(angle * (4 + index) + phase) * amp;

        const r = baseRadius + wave;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 2);
      gradient.addColorStop(0, colors[index % colors.length]);
      gradient.addColorStop(1, "transparent");

      ctx.globalAlpha = 0.55;
      ctx.fillStyle = gradient;
      ctx.filter = "blur(18px)";
      ctx.fill();
      ctx.filter = "none";
    };

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < layers; i++) {
        drawLayer(i);
      }

      t += speed * 60;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [size, audioLevel, speed, colors, layers]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}

/**
 * DotSphere
 * 10k animated dots moving along the surface of a rotating sphere.
 * Designed as a background visualization.
 *
 * Props:
 * size = 600
 * dotCount = 10000
 * speed = 0.0015
 * dotSize = 1.2
 * color = "#60a5fa"
 */
export function DotSphere({
  size = 600,
  dotCount = 10000,
  speed = 0.0015,
  dotSize = 1.2,
  color = "#60a5fa",
}) {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.32;

    // Generate random sphere points
    const points = new Array(dotCount).fill(0).map(() => {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      return {
        theta,
        phi,
      };
    });

    let rot = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;

      rot += speed * 60;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        const x3 = radius * Math.sin(p.phi) * Math.cos(p.theta + rot);
        const y3 = radius * Math.sin(p.phi) * Math.sin(p.theta + rot);
        const z3 = radius * Math.cos(p.phi);

        const perspective = 1 + z3 / (radius * 2);
        const x2 = cx + x3 * perspective;
        const y2 = cy + y3 * perspective;

        ctx.globalAlpha = perspective;
        ctx.beginPath();
        ctx.arc(x2, y2, dotSize * perspective, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [size, dotCount, speed, dotSize, color]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}
