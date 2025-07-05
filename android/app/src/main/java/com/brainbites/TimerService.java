// android/app/src/main/java/com/brainbites/TimerService.java
package com.brainbites;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Bundle;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

import javax.annotation.Nullable;

public class TimerService extends HeadlessJsTaskService {
    
    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        
        if (extras != null) {
            return new HeadlessJsTaskConfig(
                "TimerHeadlessTask",
                Arguments.fromBundle(extras),
                5000, // timeout for the task
                true // optional: defines whether or not the task is allowed in foreground
            );
        }
        
        return new HeadlessJsTaskConfig(
            "TimerHeadlessTask",
            Arguments.createMap(),
            5000,
            true
        );
    }
}