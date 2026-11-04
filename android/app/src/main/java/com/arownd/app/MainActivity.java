package com.arownd.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ArowndSystemUiPlugin.class);
        registerPlugin(ArowndSecureStoragePlugin.class);
        registerPlugin(ArowndBiometricPlugin.class);
        registerPlugin(ArowndAppUpdatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
