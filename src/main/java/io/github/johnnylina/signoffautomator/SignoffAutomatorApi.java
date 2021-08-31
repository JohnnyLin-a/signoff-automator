package io.github.johnnylina.signoffautomator;

import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.Calendar;
import java.util.Date;

public class SignoffAutomatorApi {
    private static boolean continueExecution = true;
    private static final Map<String, String> env = new HashMap<>();

    public SignoffAutomatorApi() {
        this.Init();
    }

    private void Init() throws IllegalArgumentException {
        Map<String, String> env = System.getenv();
        // DISCORD_LOGIN
        // DISCORD_PASSWORD
        for (Map.Entry<String, String> envEntry : env.entrySet()) {
            switch (envEntry.getKey()) {
                case "DISCORD_LOGIN":
                case "DISCORD_PASSWORD":
                case "DISCORD_SERVER_ID":
                case "DISCORD_CHANNEL_ID":
                    SignoffAutomatorApi.env.put(envEntry.getKey(), envEntry.getValue());
                default:
            }
        }
        if (!SignoffAutomatorApi.env.containsKey("DISCORD_LOGIN")) {
            throw new IllegalArgumentException("No DISCORD_LOGIN env var set");
        }
        if (!SignoffAutomatorApi.env.containsKey("DISCORD_PASSWORD")) {
            throw new IllegalArgumentException("No DISCORD_PASSWORD env var set");
        }
        if (!SignoffAutomatorApi.env.containsKey("DISCORD_SERVER_ID")) {
            throw new IllegalArgumentException("No DISCORD_SERVER_ID env var set");
        }
        if (!SignoffAutomatorApi.env.containsKey("DISCORD_CHANNEL_ID")) {
            throw new IllegalArgumentException("No DISCORD_CHANNEL_ID env var set");
        }
    }

    public void execute() throws RuntimeException {
        Thread autoCloseThread = new Thread(new AutoCloseTimer());
        autoCloseThread.start();

        int i = 0;
        while (SignoffAutomatorApi.continueExecution) {
            i++;
            System.out.println("Continue Execution " + i);
        }
    }

    /**
     * AutoCloseTimer is a Timer to automatically let the api know that the
     * execution should stop.
     */
    private class AutoCloseTimer implements Runnable {

        @Override
        public void run() {
            Calendar sevenPMTodayCal = Calendar.getInstance();
            sevenPMTodayCal.setTimeZone(TimeZone.getTimeZone("America/New_York"));
            sevenPMTodayCal.set(Calendar.HOUR_OF_DAY, 19);
            sevenPMTodayCal.set(Calendar.MINUTE, 0);
            sevenPMTodayCal.set(Calendar.SECOND, 0);
            Date sevenPMToday = sevenPMTodayCal.getTime();
            boolean debug;
            try {
                debug = Boolean.parseBoolean(SignoffAutomatorApi.env.getOrDefault("DEBUG", "false"));
            } catch (Exception e) {
                debug = false;
            }

            for (Date d = new Date(); d.before(sevenPMToday) || debug; d = new Date()) {
            }
            SignoffAutomatorApi.continueExecution = false;
        }
    }
}
