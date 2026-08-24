'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __promptGoogle?: () => void;
  }
}

export function GoogleAuthBridge() {
  useEffect(() => {
    const scriptId = 'google-gsi-client';
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const onCredential = (credential: string) => {
      window.dispatchEvent(new CustomEvent('google-credential', { detail: credential }));
    };

    const initGoogle = () => {
      if (!(window as any).google || !clientId) return;
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) onCredential(response.credential);
        },
      });
      window.__promptGoogle = () => (window as any).google.accounts.id.prompt();
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else if ((window as any).google) {
      initGoogle();
    }

    return () => {
      window.__promptGoogle = undefined;
    };
  }, []);

  return null;
}
