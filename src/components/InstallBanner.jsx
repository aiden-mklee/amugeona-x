import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'amugeona:installDismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true)
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try { if (localStorage.getItem(DISMISSED_KEY)) return; } catch {}

    if (isIOS()) {
      setIos(true);
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 비Chrome 브라우저: 이벤트가 없으면 1.5초 후 범용 안내 표시
    const timer = setTimeout(() => setVisible((v) => v || true), 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch {}
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="install-banner">
      <span className="install-banner__text">
        {ios
          ? '홈 화면에 추가하면 앱처럼 쓸 수 있어요 — 공유 버튼 → 홈 화면에 추가'
          : deferredPrompt
          ? '홈 화면에 추가하면 앱처럼 쓸 수 있어요.'
          : '브라우저 메뉴에서 홈 화면에 추가할 수 있어요.'}
      </span>
      {deferredPrompt && (
        <button className="install-banner__btn" onClick={install}>설치</button>
      )}
      <button className="install-banner__close" onClick={dismiss} aria-label="닫기">✕</button>
    </div>
  );
}
