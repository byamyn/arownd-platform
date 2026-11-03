import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "@/lib/platform";

interface ArowndSystemUiPlugin {
  openExternal(options: { url: string }): Promise<void>;
  shareFile(options: {
    data: string;
    fileName: string;
    mimeType: string;
  }): Promise<void>;
}

const ArowndSystemUi = registerPlugin<ArowndSystemUiPlugin>("ArowndSystemUi");

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Opens a validated web link in the operating system's default handler. */
export async function openExternalUrl(value: string): Promise<boolean> {
  const url = safeHttpUrl(value);
  if (!url) return false;

  if (isNativePlatform()) {
    await ArowndSystemUi.openExternal({ url });
    return true;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Selected file could not be encoded"));
        return;
      }
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error("Invalid file data URL"));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Shares a local file using Android's native Sharesheet on device.
 * On supported browsers, uses the Web Share API with file support.
 */
export async function shareLocalFile(file: File): Promise<boolean> {
  if (file.size === 0 || file.size > 15 * 1024 * 1024) {
    throw new Error("The file must be between 1 byte and 15 MB");
  }
  const mimeType = file.type || "application/octet-stream";
  if (
    !mimeType.startsWith("image/") &&
    mimeType !== "application/pdf" &&
    mimeType !== "text/plain"
  ) {
    throw new Error("This file type cannot be shared");
  }

  if (isNativePlatform()) {
    await ArowndSystemUi.shareFile({
      data: await fileToBase64(file),
      fileName: file.name || "arownd-share",
      mimeType,
    });
    return true;
  }

  if (typeof navigator.share === "function") {
    const data = { files: [file], title: file.name };
    if (typeof navigator.canShare !== "function" || navigator.canShare(data)) {
      await navigator.share(data);
      return true;
    }
  }
  return false;
}
