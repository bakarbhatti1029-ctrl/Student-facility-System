import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../utils/api';

const toUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(window.atob(value), character => character.charCodeAt(0));
};

const PushNotificationButton = () => {
  const [state, setState] = useState('checking');
  const [feedback, setFeedback] = useState('');
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
      setFeedback('');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'disabled');
        toast.warn('Notification permission was not granted.', { toastId: 'push-status' });
        return;
      }

      const headers = {};
      const [{ data }, registration] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/push/public-key`, { headers }),
        navigator.serviceWorker.ready,
      ]);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(data.publicKey)
      });
      await axios.post(`${API_BASE_URL}/api/push/subscribe`, subscription.toJSON(), { headers });
      setState('enabled');
      setFeedback('Notifications enabled.');
      toast.success('Notifications enabled.', { toastId: 'push-status' });
      // Confirm immediately; actual booking/order alerts are sent later by
      // the backend when a relevant event occurs.
      registration.showNotification('SFS notifications enabled', {
        body: 'You will receive booking and order updates on this device.',
        icon: '/logo.png',
        tag: 'sfs-notifications-enabled'
      }).catch(() => { });
    } catch (error) {
      console.error('Could not enable push notifications:', error);
      setState('disabled');
      const message = error.response?.data?.message || 'Could not enable notifications. Check browser permission and try again.';
      setFeedback(message);
      toast.error(message, { toastId: 'push-status' });
    }
  };

  const disable = async () => {
    try {
      setState('working');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        setState('disabled');

        // A server cleanup failure must not prevent the owner from turning off
        // notifications on this device. Invalid subscriptions are also removed
        // automatically by the notification service when a send fails.
        try {
          await axios.delete(`${API_BASE_URL}/api/push/unsubscribe`, {
            headers: {},
            data: { endpoint }
          });
        } catch (error) {
          console.warn('Could not remove the server push subscription:', error);
        }
      }

      setState('disabled');
      setFeedback('Notifications disabled.');
      toast.info('Notifications disabled.', { toastId: 'push-status' });
    } catch (error) {
      console.error('Could not disable push notifications:', error);
      setState('enabled');
      toast.error('Could not disable notifications. Please try again.', { toastId: 'push-status' });
    }
  };

  if (state === 'unsupported') return null;
  const isBusy = state === 'working' || state === 'checking';
  const isBlocked = state === 'denied';
  const isEnabled = state === 'enabled';
  const tooltip = isEnabled
    ? 'Disable phone alerts'
    : isBlocked
      ? 'Notifications are blocked. Allow them in your phone or browser settings.'
      : isBusy
        ? 'Setting up phone alerts…'
        : 'Enable phone alerts';

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={isEnabled ? disable : enable}
        disabled={isBusy || isBlocked}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-default disabled:opacity-45 ${isEnabled ? 'text-emerald-300 drop-shadow-[0_0_7px_rgba(110,231,183,0.7)] hover:scale-110' : 'text-white/80 hover:scale-110 hover:text-white'}`}
        title={tooltip}
        aria-label={tooltip}
      >
        {isBlocked ? '🔕' : '🔔'}
      </button>
      {feedback && (
        <span role="status" className="absolute right-0 top-11 z-50 w-56 rounded bg-black/90 px-2 py-1 text-xs leading-4 text-white shadow-lg">
          {feedback}
        </span>
      )}
    </span>
  );
};

export default PushNotificationButton;