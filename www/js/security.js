/* ============================================
   Zarbin - Security Module (PIN lock + auto-lock)
   ماژول امنیت — قفل PIN و قفل خودکار
   ============================================ */

const Security = {
  // Check if Web Crypto API is available (requires Android WebView 60+,
  // i.e., Android 7.0+. On older devices, we fall back to a simpler hash.)
  hasWebCrypto() {
    return !!(window.crypto && window.crypto.subtle);
  },

  // PBKDF2-based PIN hashing using Web Crypto API.
  // Falls back to a simple SHA-256 hash if crypto.subtle is not available.
  // Returns a base64 string of "salt:hash" for storage.
  async hashPin(pin) {
    if (this.hasWebCrypto()) {
      return await this._hashPinPBKDF2(pin);
    }
    // Fallback: simple hash (less secure but works on all devices)
    return this._hashPinSimple(pin);
  },

  async _hashPinPBKDF2(pin) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 10000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const saltB64 = this._bytesToBase64(saltBytes);
    const hashB64 = this._bytesToBase64(new Uint8Array(bits));
    return 'pbkdf2:' + saltB64 + ':' + hashB64;
  },

  _hashPinSimple(pin) {
    // Simple hash fallback for old WebViews (Android 5-6)
    // Not as secure as PBKDF2 but better than plaintext
    var salt = '';
    var chars = '0123456789abcdef';
    for (var i = 0; i < 32; i++) {
      salt += chars[Math.floor(Math.random() * 16)];
    }
    var hash = this._simpleHash(salt + pin + salt);
    return 'simple:' + salt + ':' + hash;
  },

  _simpleHash(str) {
    // FNV-1a hash (simple, fast, no dependencies)
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  },

  _bytesToBase64(bytes) {
    var result = '';
    for (var i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(bytes[i]);
    }
    return btoa(result);
  },

  async verifyPin(pin, storedHash) {
    if (!storedHash) return false;
    var parts = storedHash.split(':');
    if (parts.length < 3) return false;
    var method = parts[0];
    if (method === 'pbkdf2') {
      return await this._verifyPinPBKDF2(pin, parts[1], parts[2]);
    } else if (method === 'simple') {
      return this._verifyPinSimple(pin, parts[1], parts[2]);
    }
    return false;
  },

  async _verifyPinPBKDF2(pin, saltB64, expectedHashB64) {
    if (!this.hasWebCrypto()) return false;
    try {
      var saltBytes = this._base64ToBytes(saltB64);
      var enc = new TextEncoder();
      var keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
      );
      var bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 10000, hash: 'SHA-256' },
        keyMaterial, 256
      );
      var actualHashB64 = this._bytesToBase64(new Uint8Array(bits));
      return actualHashB64 === expectedHashB64;
    } catch (e) {
      console.error('PIN verify failed:', e);
      return false;
    }
  },

  _verifyPinSimple(pin, salt, expectedHash) {
    var actualHash = this._simpleHash(salt + pin + salt);
    return actualHash === expectedHash;
  },

  _base64ToBytes(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  },

  isPinSet() {
    return !!(Store.state.security && Store.state.security.pinHash);
  },

  isPinEnabled() {
    return !!(Store.state.security && Store.state.security.pinEnabled && this.isPinSet());
  },

  async setPin(pin) {
    if (!pin || pin.length < 4) throw new Error('PIN باید حداقل ۴ رقم باشد');
    var hash = await this.hashPin(pin);
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
    var s = Store.state.security;
    if (s.explicitlyLocked) return true;
    if (!s.lastActiveAt) return true;
    var timeoutMs = (s.autoLockMinutes || 5) * 60 * 1000;
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
      var BiometricAuth = Capacitor.Plugins.BiometricAuth;
      var result = await BiometricAuth.verify({
        reason: 'باز کردن قفل زرین',
        title: 'احراز هویت',
        subtitle: 'برای دسترسی به داده‌های مالی'
      });
      if (result && result.verified) {
        this.unlock();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
};

if (typeof window !== 'undefined') window.Security = Security;
