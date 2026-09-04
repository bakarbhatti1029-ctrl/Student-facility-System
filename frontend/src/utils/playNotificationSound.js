// Plays a short two-tone beep via the Web Audio API — no audio file to ship,
// works everywhere, and is loud enough to notice without being jarring.
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    [880, 1175].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      const start = now + i * 0.15;
      const end = start + 0.15;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(end);
    });

    setTimeout(() => ctx.close(), 500);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}
