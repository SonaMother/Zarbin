/* ============================================
   Zarbin - Security Module (PIN lock + auto-lock)
   ماژول امنیت — قفل PIN و قفل خودکار
   ============================================ */

const Security = {
  // State is stored in Store.state.security, but we expose simple methods here.

  // PBKDF2-based PIN hashing using Web Crypto API.
  // Returns a base64 string of "salt:hash" for storage.
  async hashPin(pin) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 10000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const saltB64 = btoa(String.fromCharCode(...saltBytes));
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
    return `${saltB64}:${hashB64}`;
  },

  async verifyPin(pin, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [saltB64, expectedHashB64] = storedHash.split(':');
    try {
      const saltBytes = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
      );
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 10000, hash: 'SHA-256' },
        keyMaterial, 256
      );
      const actualHashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
      return actualHashB64 === expectedHashB64;
    } catch (e) {
      console.error('PIN verify failed:', e);
      return false;
    }
  },

  isPinSet() {
    return !!(Store.state.security && Store.state.security.pinHash);
  },

  isPinEnabled() {
    return !!(Store.state.security && Store.state.security.pinEnabled && this.isPinSet());
  },

  async setPin(pin) {
    if (!pin || pin.length < 4) throw new Error('PIN باید حداقل ۴ رقم باشد');
    const hash = await this.hashPin(pin);
    if (!Store.state.security) Store.state.security = {};
    Store.state.security.pinHash = hash;
    Store.state.security.pinEnabled = true;
    Store.state.security.failedAttempts = 0;
    Store.save();
  },

  disablePin() {
    if (!Store.state.security) Store.state.security = {};
    Store.state.security.pinEnabled = false;
    Store.state.security.pinHash = null;
    Store.save();
  },

  // Auto-lock logic
  isLocked() {
    if (!this.isPinEnabled()) return false;
    const s = Store.state.security;
    if (s.explicitlyLocked) return true;
    if (!s.lastActiveAt) return true;
    const timeoutMs = (s.autoLockMinutes || 5) * 60 * 1000;
    return (Date.now() - s.lastActiveAt) > timeoutMs;
  },

  lock() {
    if (!Store.state.security) Store.state.security = {};
    Store.state.security.explicitlyLocked = true;
    Store.save();
  },

  unlock() {
    if (!Store.state.security) Store.state.security = {};
    Store.state.security.explicitlyLocked = false;
    Store.state.security.lastActiveAt = Date.now();
    Store.state.security.failedAttempts = 0;
    Store.save();
  },

  touchActivity() {
    if (!Store.state.security) Store.state.security = {};
    Store.state.security.lastActiveAt = Date.now();
    // Don't save on every touch — too expensive. Caller can batch.
  },

  // Biometric (Capacitor plugin if available, otherwise not supported)
  isBiometricAvailable() {
    return !!(window.Capacitor &&
              Capacitor.Plugins &&
              Capacitor.Plugins.BiometricAuth);
  },

  async biometricUnlock() {
    if (!this.isBiometricAvailable()) return false;
    try {
      const { BiometricAuth } = Capacitor.Plugins;
      const result = await BiometricAuth.verify({
        reason: 'باز کردن قفل زرین',
        title: 'احراز هویت',
        subtitle: 'برای دسترسی به داده‌های مالی',
        description: 'از اثر انگشت یا چهره خود استفاده کنید'
      });
      if (result && result.verified) {
        this.unlock();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Biometric unlock failed:', e);
      return false;
    }
  }
};

if (typeof window !== 'undefined') window.Security = Security;
