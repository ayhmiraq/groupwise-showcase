import { useEffect, useRef } from "react";

export type AetherOptions = {
  density: number;
  speed: number;
  hue: number;
  glow: number;
  grid: boolean;
  scan: boolean;
};

type Star = {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
};

/**
 * "Aether — Deep Field Survey": a slow parallax deep-space survey field.
 * Drifting star layers, nebula bloom, survey grid and a sweeping scan line.
 * Purely decorative — it sits behind the overlay so text colors never change.
 */
export function AetherField({ options }: { options: AetherOptions }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Smaller screens get a lighter field so scrolling stays smooth.
    const isSmall = window.innerWidth < 768;
    const densityScale = isSmall ? 0.45 : 1;
    const frameInterval = 1000 / (isSmall ? 24 : 30);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let raf = 0;
    let last = performance.now();
    let lastFrame = 0;
    let t = 0;
    let visible = true;
    let running = false;

    function seed() {
      const count = Math.max(
        14,
        Math.min(600, Math.round(optsRef.current.density * densityScale)),
      );
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.25 + Math.random() * 0.75,
        r: 0.4 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw(now: number) {
      // Frame limiter: the field is decorative, so a lower frame rate keeps the
      // main thread free for scrolling and image decoding.
      if (now - lastFrame < frameInterval) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const o = optsRef.current;
      const speed = reduce ? 0 : Math.max(0, o.speed) / 10;
      t += dt * (reduce ? 0 : 1);

      const hue = o.hue;
      const glow = Math.max(0, Math.min(100, o.glow)) / 100;

      ctx!.clearRect(0, 0, width, height);

      // nebula bloom
      const blooms = [
        { x: width * 0.22, y: height * 0.3, r: Math.max(width, height) * 0.55, h: hue },
        { x: width * 0.8, y: height * 0.75, r: Math.max(width, height) * 0.45, h: hue + 35 },
      ];
      for (const b of blooms) {
        const drift = Math.sin(t * 0.15 + b.h) * 24;
        const g = ctx!.createRadialGradient(b.x + drift, b.y - drift * 0.5, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.h}, 70%, 55%, ${0.22 * glow})`);
        g.addColorStop(0.5, `hsla(${b.h}, 65%, 40%, ${0.1 * glow})`);
        g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, width, height);
      }

      // survey grid
      if (o.grid) {
        ctx!.save();
        ctx!.strokeStyle = `hsla(${hue}, 60%, 70%, ${0.08 + 0.06 * glow})`;
        ctx!.lineWidth = 1;
        const step = 64;
        const shift = (t * speed * 6) % step;
        ctx!.beginPath();
        for (let x = -step + shift; x < width + step; x += step) {
          ctx!.moveTo(x, 0);
          ctx!.lineTo(x, height);
        }
        for (let y = -step + shift; y < height + step; y += step) {
          ctx!.moveTo(0, y);
          ctx!.lineTo(width, y);
        }
        ctx!.stroke();

        // survey rings
        const cx = width * 0.72;
        const cy = height * 0.42;
        for (let i = 1; i <= 3; i++) {
          ctx!.beginPath();
          ctx!.strokeStyle = `hsla(${hue + 25}, 75%, 72%, ${0.12 * glow})`;
          ctx!.arc(cx, cy, 60 * i + Math.sin(t * 0.4 + i) * 6, 0, Math.PI * 2);
          ctx!.stroke();
        }
        ctx!.restore();
      }

      // parallax star field
      for (const s of stars) {
        s.x -= speed * s.z * 14 * dt * 4;
        s.y += speed * s.z * 3 * dt * 4;
        if (s.x < -4) s.x = width + 4;
        if (s.y > height + 4) s.y = -4;
        const twinkle = 0.55 + 0.45 * Math.sin(t * 1.6 + s.phase);
        const alpha = Math.min(1, (0.25 + 0.75 * s.z) * twinkle);
        ctx!.beginPath();
        ctx!.fillStyle = `hsla(${hue + 30 * s.z}, 85%, ${72 + 18 * s.z}%, ${alpha})`;
        ctx!.arc(s.x, s.y, s.r * (0.6 + s.z * 0.8), 0, Math.PI * 2);
        ctx!.fill();
        if (s.z > 0.85) {
          ctx!.beginPath();
          ctx!.fillStyle = `hsla(${hue + 40}, 90%, 80%, ${0.12 * glow * twinkle})`;
          ctx!.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // scan sweep
      if (o.scan) {
        const period = 9;
        const p = (t % period) / period;
        const y = p * height;
        const g = ctx!.createLinearGradient(0, y - 90, 0, y + 90);
        g.addColorStop(0, "hsla(0,0%,0%,0)");
        g.addColorStop(0.5, `hsla(${hue + 20}, 85%, 75%, ${0.14 * glow})`);
        g.addColorStop(1, "hsla(0,0%,0%,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, y - 90, width, 180);
        ctx!.fillStyle = `hsla(${hue + 20}, 90%, 85%, ${0.22 * glow})`;
        ctx!.fillRect(0, y, width, 1);
      }

      raf = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      lastFrame = 0;
      raf = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function sync() {
      if (visible && document.visibilityState === "visible") start();
      else stop();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Animate only while the canvas is on screen and the tab is active.
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting);
          sync();
        },
        { rootMargin: "120px" },
      );
      io.observe(canvas);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      stop();
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
