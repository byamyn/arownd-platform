/**
 * The Android-only plugin is installed and synchronized by the native bootstrap
 * workflow. Keep a local ambient declaration so web/quality workflows can typecheck
 * before that workflow commits the generated dependency files.
 */
declare module "@capawesome/capacitor-app-update";
