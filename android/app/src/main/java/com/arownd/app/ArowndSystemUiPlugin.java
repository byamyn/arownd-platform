package com.arownd.app;

import android.graphics.Color;
import android.os.Build;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ArowndSystemUi")
public class ArowndSystemUiPlugin extends Plugin {
    @PluginMethod
    public void setStatusBar(PluginCall call) {
        JSObject options = call.getData();
        boolean dark = options.getBool("dark", false);
        String color = options.getString("color");

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                WindowInsetsControllerCompat controller =
                    WindowCompat.getInsetsController(window, window.getDecorView());
                controller.setAppearanceLightStatusBars(!dark);
            }

            if (Build.VERSION.SDK_INT < 35 && color != null && !color.isEmpty()) {
                try {
                    window.setStatusBarColor(Color.parseColor(color));
                } catch (IllegalArgumentException ignored) {
                    // Ignore invalid CSS colors instead of breaking native navigation.
                }
            } else if (Build.VERSION.SDK_INT >= 35) {
                window.setStatusBarColor(Color.TRANSPARENT);
            }
            call.resolve();
        });
    }
}
