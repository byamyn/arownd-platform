import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "@/lib/platform";

interface ArowndSecureStoragePlugin {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

const SecureStorage = registerPlugin<ArowndSecureStoragePlugin>("ArowndSecureStorage");

/**
 * Supabase auth storage:
 * - Android uses AES-GCM ciphertext with its key protected by Android Keystore.
 * - Web keeps the standard localStorage behavior.
 * - Existing Android localStorage sessions are migrated once, then removed.
 *
 * Capacitor Preferences is intentionally not used here because it is not encrypted.
 */
export const supabaseAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isNativePlatform()) {
      return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    }

    const stored = await SecureStorage.get({ key });
    if (stored.value !== null) return stored.value;

    // One-time migration for users upgrading from the previous WebView storage.
    const legacy = window.localStorage.getItem(key);
    if (legacy !== null) {
      await SecureStorage.set({ key, value: legacy });
      window.localStorage.removeItem(key);
    }
    return legacy;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isNativePlatform()) {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      return;
    }
    await SecureStorage.set({ key, value });
  },

  async removeItem(key: string): Promise<void> {
    if (!isNativePlatform()) {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
      return;
    }
    await SecureStorage.remove({ key });
    // Remove any stale pre-migration copy as well.
    window.localStorage.removeItem(key);
  },
};
