// Shared bits for announcing new web orders inside the admin panel.

/** Fired by the panel when a new order arrives (the Orders page reloads). */
export const NEW_ORDER_EVENT = 'admin:new-order';
/** Fired after an order status changes (the menu badge updates right away). */
export const ORDERS_CHANGED_EVENT = 'admin:orders-changed';
/** Fired after the admin reads or deletes a contact message */
export const MESSAGES_CHANGED_EVENT = 'admin:messages-changed';

export const ORDER_POLL_MS = 60_000;

/** Short two-note chime made with Web Audio, so no sound file is needed. */
export function playChime() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Sound blocked or unsupported: the badge and the toast still show it
  }
}
