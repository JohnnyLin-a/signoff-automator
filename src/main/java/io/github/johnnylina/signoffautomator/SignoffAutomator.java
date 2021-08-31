package io.github.johnnylina.signoffautomator;

public class SignoffAutomator {
    public static void main(String[] args) {
        try {
            SignoffAutomatorApi api = new SignoffAutomatorApi();
        } catch (IllegalArgumentException iae) {
            System.out.println("Error when initializing api" + iae.getMessage());
        }
        System.out.println("Detected all login details");
    }
}