import { useRef, useState } from 'react';
import { useT } from '../../components/useT';
import styles from './AuthPanel.module.css';

type AuthPanelProps = {
  video: string | undefined;
  poster: string;
};

// Without a video URL the poster frame stands in.
export function AuthPanel({ video, poster }: AuthPanelProps) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(video !== undefined);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
      el.play().catch(() => setPlaying(false));
    }
  };

  return (
    <aside className={styles.panel}>
      <video
        ref={ref}
        className={styles.video}
        src={video}
        poster={poster}
        autoPlay={playing}
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      {video && (
        <button type="button" className={styles.toggle} onClick={toggle}>
          {playing ? t('auth.panel.pause') : t('auth.panel.play')}
        </button>
      )}
      <div className={styles.caption}>
        <h2 className={styles.title}>{t('auth.panel.title')}</h2>
        <p className={styles.lead}>{t('auth.panel.lead')}</p>
      </div>
    </aside>
  );
}
