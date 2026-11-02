import { useEffect, useRef } from 'react';
import { VideoPlayer } from '../../components/VideoPlayer';
import { MATCH_VIDEO } from '../../lib/report/video';
import { useT } from '../components/useT';
import { rallyRef } from '../lib/format';
import type { Clip } from '../lib/types';
import styles from './ClipDock.module.css';

type ClipDockProps = {
  clip: Clip;
  match: boolean;
  onClose: () => void;
};

const ignore = () => undefined;

// The rally being watched: a column beside the report on a wide screen, a sheet at the bottom on a narrow one.
// It takes focus when a rally starts so the close button and Escape are one key away,
// and gives it back to whatever opened it when it closes.
export function ClipDock({ clip, match, onClose }: ClipDockProps) {
  const t = useT();
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    close.current?.focus({ preventScroll: true });
  }, [clip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className={styles.dock} aria-label={t('video.label')}>
      <header className={styles.header}>
        <p className={styles.title} aria-live="polite">
          {t('video.now', { rally: rallyRef(t, clip, match) })}
        </p>
        <button ref={close} type="button" className={styles.close} onClick={onClose}>
          {t('video.close')}
        </button>
      </header>
      <VideoPlayer src={MATCH_VIDEO} label={t('video.label')} missing={t('video.missing')} start={clip.start_sec} end={clip.end_sec} onTime={ignore} />
    </aside>
  );
}
