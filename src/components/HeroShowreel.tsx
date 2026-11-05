"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/video/showreel.mp4";
const POSTER = "/video/showreel-poster.jpg";

/**
 * Showreel integrado al hero: sin marco ni controles. Los bordes se disuelven
 * en el fondo (máscara), reproduce en loop y en silencio. Al hacer click se
 * abre una vista ampliada con sonido y controles.
 */
export default function HeroShowreel() {
  const inline = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const full = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mq.matches);
      if (mq.matches) inline.current?.pause();
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const openFull = () => {
    const d = dialog.current;
    if (!d || d.open) return;
    inline.current?.pause();
    d.showModal();
    const v = full.current;
    if (v) {
      v.currentTime = 0;
      v.muted = false;
      void v.play().catch(() => {});
    }
  };

  const onClose = () => {
    full.current?.pause();
    if (!reduced) void inline.current?.play().catch(() => {});
  };

  return (
    <>
      <button
        type="button"
        className="showreel"
        onClick={openFull}
        aria-label="Ver el showreel de SmokIA con sonido (15 segundos)"
        data-cta="showreel_open"
      >
        <span className="showreel-glow" aria-hidden="true" />
        <video
          ref={inline}
          className="showreel-video"
          src={SRC}
          poster={POSTER}
          autoPlay={!reduced}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        />
        <span className="showreel-play">
          <span className="showreel-play-icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
            </svg>
          </span>
          <span className="mono showreel-play-label">Ver showreel · 0:15</span>
        </span>
      </button>

      <dialog ref={dialog} className="showreel-dialog" onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="showreel-dialog-inner">
          <button type="button" className="showreel-close mono" onClick={() => dialog.current?.close()} aria-label="Cerrar showreel">
            Cerrar ✕
          </button>
          <video ref={full} src={SRC} poster={POSTER} controls playsInline preload="none" />
        </div>
      </dialog>
    </>
  );
}
