import { useEffect } from 'react';

export default function Chatbot() {
  useEffect(() => {
    // Load chatbot script only once
    if (document.getElementById('sk-chatbot-script')) return;
    const script = document.createElement('script');
    script.id = 'sk-chatbot-script';
    script.src = '/chatbot.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // cleanup: remove injected DOM on unmount
      const btn = document.getElementById('sk-btn');
      const win = document.getElementById('sk-win');
      if (btn) btn.remove();
      if (win) win.remove();
    };
  }, []);
  return null;
}
