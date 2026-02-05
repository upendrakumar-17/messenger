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
  audioLevel =9999,
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
