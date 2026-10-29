import { useEffect, useRef, useState } from 'react';
import styles from './VideoPlayer.module.css';

type VideoPlayerProps = {
  src: string;
  label: string;
  missing: string;
  start: number | null;
  end: number | null;
  onTime: (sec: number) => void;
};

export function VideoPlayer({ src, label, missing, start, end, onTime }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const stopAt = useRef<number | null>(null);
  const onTimeRef = useRef(onTime);
  const [failed, setFailed] = useState(false);
  onTimeRef.current = onTime;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    stopAt.current = start === null ? null : end;
    if (!el || start === null) return;

    const go = () => {
      onTimeRef.current(start);
      el.currentTime = start;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      el.play().catch(() => undefined);
    };

    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) go();
    else el.addEventListener('loadedmetadata', go, { once: true });
    return () => el.removeEventListener('loadedmetadata', go);
  }, [start, end]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const emit = () => onTimeRef.current(el.currentTime);
    const tick = () => {
      emit();
      frame = requestAnimationFrame(tick);
    };
    const onPause = () => cancelAnimationFrame(frame);
    const onPlay = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      const endAt = stopAt.current;
      if (endAt !== null && el.currentTime >= endAt) {
        el.pause();
        stopAt.current = null;
      }
    };
    const onTick = () => {
      stop();
      emit();
    };
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('seeked', emit);
    el.addEventListener('timeupdate', onTick);
    if (!el.paused) onPlay();
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('seeked', emit);
      el.removeEventListener('timeupdate', onTick);
    };
  }, [src, failed]);

  return (
    <div className={styles.player}>
      {src && (
        <video
          ref={ref}
          className={styles.video}
          src={src}
          hidden={failed}
          controls
          playsInline
          preload="metadata"
          aria-label={label}
          onError={() => setFailed(true)}
        />
      )}
      {(!src || failed) && <p className={styles.missing}>{missing}</p>}
    </div>
  );
}
