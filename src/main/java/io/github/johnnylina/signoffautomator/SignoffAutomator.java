package io.github.johnnylina.signoffautomator;

public class SignoffAutomator {
    public static void main(String[] args) {
        final SignoffAutomatorApi api;
        try {
            api = new SignoffAutomatorApi();
        } catch (IllegalArgumentException iae) {
            System.out.println("Error when initializing api" + iae.getMessage());
            System.exit(1);
            return;
        }
        try {
            api.execute();
        } catch (RuntimeException re) {
            System.out.println("Error when Executing api " + re.getMessage());
            if (SignoffAutomatorApi.getDebug()) {
                re.printStackTrace();
            }
        }
        System.out.println("Main execution done");
        if (SignoffAutomatorApi.getDebug()) {
            SignoffAutomatorApi.resetDebug();
        }
    }
}