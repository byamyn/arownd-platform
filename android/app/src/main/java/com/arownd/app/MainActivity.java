package com.arownd.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ArowndSystemUiPlugin.class);
        registerPlugin(ArowndSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
