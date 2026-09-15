import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../../utils/api';

const toUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(window.atob(value), character => character.charCodeAt(0));
};

const PushNotificationButton = () => {
  const [state, setState] = useState('checking');
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  useEffect(() => {
    if (!supported) return setState('unsupported');
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => registration.pushManager.getSubscription())
      .then(subscription => setState(subscription ? 'enabled' : Notification.permission === 'denied' ? 'denied' : 'disabled'))
      .catch(() => setState('unsupported'));
  }, [supported]);

  const enable = async () => {
    try {
      setState('working');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState(permission === 'denied' ? 'denied' : 'disabled');
      const token = Cookies.get('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [{ data }, registration] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/push/public-key`, { headers }),
        navigator.serviceWorker.ready,
      ]);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(data.publicKey),
      });
      await axios.post(`${API_BASE_URL}/api/push/subscribe`, subscription.toJSON(), { headers });
      setState('enabled');
    } catch (error) {
      console.error('Could not enable push notifications:', error);
      setState('disabled');
    }
  };

  if (state === 'unsupported') return null;
  return (
    <button
      type="button"
      onClick={enable}
      disabled={state === 'enabled' || state === 'working' || state === 'checking' || state === 'denied'}
      className="w-full rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-left text-sm font-semibold text-amber-200 disabled:cursor-default disabled:opacity-70"
      title={state === 'denied' ? 'Allow notifications in your phone or browser settings.' : undefined}
    >
      {state === 'enabled' ? '🔔 Phone alerts enabled' : state === 'denied' ? '🔕 Notifications blocked' : state === 'working' || state === 'checking' ? 'Enabling alerts…' : '🔔 Enable phone alerts'}
    </button>
  );
};

export default PushNotificationButton;
