// android/app/src/main/java/com/brainbites/TimerModule.java
package com.brainbites;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class TimerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "BrainBitesTimer";
    private static final int TIMER_INTERVAL = 1000; // 1 second
    private AlarmManager alarmManager;
    private PendingIntent pendingIntent;

    public TimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startBackgroundTimer(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent(context, TimerService.class);
            
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            
            pendingIntent = PendingIntent.getService(context, 0, intent, flags);
            
            // Set repeating alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + TIMER_INTERVAL,
                    pendingIntent
                );
            } else {
                alarmManager.setRepeating(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + TIMER_INTERVAL,
                    TIMER_INTERVAL,
                    pendingIntent
                );
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("TIMER_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopBackgroundTimer(Promise promise) {
        try {
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent = null;
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("TIMER_ERROR", e.getMessage());
        }
    }
}