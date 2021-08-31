package io.github.johnnylina.signoffautomator;

import java.util.HashMap;
import java.util.Map;

public class SignoffAutomatorApi {
    private Map<String, String> env;

    public SignoffAutomatorApi() {
        this.env = new HashMap<String, String>();
        this.init();
    }

    private void init() throws IllegalArgumentException {
        Map<String, String> env = System.getenv();
        // DISCORD_LOGIN
        // DISCORD_PASSWORD
        for (Map.Entry<String, String> envEntry : env.entrySet()) {
            switch (envEntry.getKey()) {
                case "DISCORD_LOGIN":
                case "DISCORD_PASSWORD":
                    this.env.put(envEntry.getKey(), envEntry.getValue());
                default:
            }
        }
        if (!this.env.containsKey("DISCORD_LOGIN")) {
            throw new IllegalArgumentException("No DISCORD_LOGIN env var set");
        }
        if (!this.env.containsKey("DISCORD_PASSWORD")) {
            throw new IllegalArgumentException("No DISCORD_PASSWORD env var set");
        }
    }
}
