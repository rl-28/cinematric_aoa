"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface NetflixIntroProps {
  onDismiss?: () => void;
  introParam?: string | null;
}

export function NetflixIntro({ onDismiss, introParam }: NetflixIntroProps) {
  const [status, setStatus] = useState<"gate" | "animating" | "done">(() => {
    if (introParam === "animating" || introParam === "fade") return "animating";
    if (introParam === "dismissed" || introParam === "skip") return "done";
    if (introParam === "gate") return "gate";
    return "gate";
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(() => {
    return introParam === "fade";
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    // 1. Clear any active timers
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    // 2. Teardown audio context cleanly
    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
        }
      } catch {
        // Silently handle environment closing errors
      }
      audioCtxRef.current = null;
    }

    // 3. Clear any session storage flag so page refresh always shows the Click to Begin page
    try {
      sessionStorage.removeItem("cinemetric_intro_dismissed");
    } catch {
      // Storage access blocked or unavailable
    }

    setStatus("done");
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  // Client check: always show "Click to Begin" gate on every page refresh
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const introParam = params.get("intro");
      if (introParam === "gate") {
        setStatus("gate");
        return;
      }
      if (introParam === "animating") {
        setStatus("animating");
        return;
      }
      if (introParam === "fade") {
        setStatus("animating");
        setIsFadingOut(true);
        return;
      }
      if (introParam === "dismissed" || introParam === "skip") {
        setStatus("done");
        return;
      }

      // Always show gate on page refresh
      setStatus("gate");
    } catch {
      // Fallback
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (audioCtxRef.current) {
        try {
          if (audioCtxRef.current.state !== "closed") {
            audioCtxRef.current.close();
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Listen for Escape key to quickly skip
  useEffect(() => {
    if (status !== "gate" && status !== "animating") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, handleDismiss]);

  const playSynthesizedIntroSound = () => {
    if (isMuted) return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.55, now);
      masterGain.connect(ctx.destination);

      // --- Layer 1: Low Sine Sub-Boom (~55Hz decaying exponentially) ---
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(55, now);
      // Subtle pitch drop for cinematic weight
      subOsc.frequency.exponentialRampToValueAtTime(26, now + 1.4);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.85, now + 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      subOsc.stop(now + 2.0);

      // --- Layer 2: Short Filtered-Noise Burst ---
      const noiseBufferLen = Math.floor(ctx.sampleRate * 0.3);
      const noiseBuffer = ctx.createBuffer(1, noiseBufferLen, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBufferLen; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(380, now);
      noiseFilter.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.03);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);

      // --- Layer 3: Gentle Rising Swell ---
      const swellOsc = ctx.createOscillator();
      const swellGain = ctx.createGain();
      swellOsc.type = "triangle";
      swellOsc.frequency.setValueAtTime(88, now);
      swellOsc.frequency.exponentialRampToValueAtTime(176, now + 1.5);

      swellGain.gain.setValueAtTime(0.001, now);
      swellGain.gain.linearRampToValueAtTime(0.2, now + 0.7);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      swellOsc.connect(swellGain);
      swellGain.connect(masterGain);
      swellOsc.start(now);
      swellOsc.stop(now + 2.4);

      // Auto close audio context after playback
      setTimeout(() => {
        try {
          if (ctx.state !== "closed") {
            ctx.close();
          }
        } catch {
          // ignore
        }
      }, 2900);
    } catch (err) {
      console.warn("Cinemetric Web Audio API playback bypassed:", err);
    }
  };

  const handleStartIntro = () => {
    setStatus("animating");
    playSynthesizedIntroSound();

    // Begin fade-out at 2.4s
    fadeTimerRef.current = setTimeout(() => {
      setIsFadingOut(true);
    }, 2400);

    // Complete animation at 3.0s
    animationTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, 3000);
  };

  if (status === "done") {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cinemetric Intro Experience"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg text-text transition-opacity duration-700 select-none ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background radial ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(229,9,20,0.18)_0%,_rgba(20,20,20,0.98)_75%)] pointer-events-none" />

      {/* Top Utilities: Audio Mute Toggle & Skip Button */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 flex items-center gap-3 z-20">
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface/80 hover:bg-neutral-800 border border-neutral-800 text-xs text-muted hover:text-white transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {isMuted ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>Muted</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span>Sound On</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Skip intro and proceed to site"
          className="px-3.5 py-1.5 rounded bg-surface/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-muted hover:text-white transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Skip Intro ✕
        </button>
      </div>

      {/* Main Content Area */}
      {status === "gate" ? (
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-[11px] font-mono tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            Interactive Algorithm Explainer
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 font-sans">
            Recommendation Algorithms, <span className="text-accent">Unmasked</span>
          </h2>

          <p className="text-sm sm:text-base text-muted max-w-md mb-8 leading-relaxed">
            Experience dual-engine linear algebra and high-dimensional vector math running live in your browser.
          </p>

          <button
            type="button"
            onClick={handleStartIntro}
            autoFocus
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-accent text-white font-bold text-base tracking-wide shadow-[0_0_35px_rgba(229,9,20,0.45)] hover:shadow-[0_0_50px_rgba(229,9,20,0.7)] hover:bg-red-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <svg className="w-5 h-5 text-white fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Click to Begin</span>
          </button>

          <span className="mt-4 text-[11px] font-mono text-neutral-500">
            Click initializes brand-safe browser Web Audio synthesizer
          </span>
        </div>
      ) : (
        /* Status === "animating" */
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          <div className="relative overflow-hidden py-4 px-8">
            <h1
              className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-[0.25em] sm:tracking-[0.35em] text-accent select-none drop-shadow-[0_0_40px_rgba(229,9,20,0.85)] animate-[pulse_2.2s_ease-in-out_infinite]"
              style={{
                letterSpacing: "0.28em",
                textShadow: "0 0 45px rgba(229, 9, 20, 0.8), 0 0 90px rgba(229, 9, 20, 0.35)",
              }}
            >
              CINEMETRIC
            </h1>

            {/* Sweep light effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-[sweep_2.2s_ease-in-out_forwards]"
              style={{
                transform: "skewX(-20deg)",
              }}
            />
          </div>

          <p className="mt-6 text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-neutral-300 font-medium">
            Real Algorithms &middot; Real Numbers
          </p>
        </div>
      )}
    </div>
  );
}
