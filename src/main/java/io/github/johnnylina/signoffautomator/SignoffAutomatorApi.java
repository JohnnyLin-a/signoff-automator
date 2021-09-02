package io.github.johnnylina.signoffautomator;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.TimeZone;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.util.ArrayDeque;
import java.util.Calendar;
import java.util.Date;
import java.util.Deque;

public class SignoffAutomatorApi {
    private static boolean continueExecution = true;
    private static final Map<String, String> env = new HashMap<>();
    private static boolean debug = false;

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
                case "DEBUG":
                case "DISCORD_USERNAME":
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
        if (SignoffAutomatorApi.env.containsKey("DEBUG")) {
            SignoffAutomatorApi.debug = Boolean.parseBoolean(SignoffAutomatorApi.env.getOrDefault("DEBUG", "false"));
        }
    }

    public void execute() throws RuntimeException {
        // Load Profile
        System.out.println("Attempt to load profile");
        File f = new File("profile");
        if (!f.exists()) {
            try {
                f.mkdir();
            } catch (Exception e) {
                throw new RuntimeException("Couldn't create profile folder.");
            }
        }
        if (!f.isDirectory()) {
            throw new RuntimeException("profile is not a directory");
        }
        System.out.println("Creating profile object");
        FirefoxProfile ffProfile = new FirefoxProfile(f);

        Thread autoCloseThread = new Thread(new AutoCloseTimer());
        System.out.println("Start autoclose thread");
        autoCloseThread.start();
        System.out.println("Setting options");
        FirefoxOptions options = new FirefoxOptions();
        options.setHeadless(!debug);
        options.setProfile(ffProfile);
        System.out.println("Init webdriver");
        WebDriver wd = new FirefoxDriver(options);
        WebElement temp = null;
        System.out.println("GET discord.com");
        wd.get("https://discord.com/channels/" + env.get("DISCORD_SERVER_ID") + "/" + env.get("DISCORD_CHANNEL_ID"));

        // Check if need to login
        System.out.println("Check login...");
        if (wd.getCurrentUrl().startsWith("https://discord.com/login")) {
            System.out.println("Need to login...");
            try {
                temp = wd.findElement(
                        By.cssSelector("input[aria-label='Email or Phone Number'][name='email'][type='text']"));
            } catch (NoSuchElementException e) {
                throw new RuntimeException("Cannot find login input");
            }
            temp.click();
            temp.sendKeys(env.get("DISCORD_LOGIN"));

            try {
                temp = wd.findElement(By.cssSelector("input[aria-label='Password'][name='password'][type='password']"));
            } catch (NoSuchElementException e) {
                throw new RuntimeException("Cannot find login input");
            }
            temp.click();
            temp.sendKeys(env.get("DISCORD_PASSWORD") + Keys.ENTER);
        }
        temp = null;

        try {
            new WebDriverWait(wd, 30).until(ExpectedConditions.urlContains("https://discord.com/channels"));
        } catch (TimeoutException e) {
            throw new RuntimeException("Stuck at login, didn't jump to channels");
        }

        // Wait for messages to appear
        try {
            new WebDriverWait(wd, 30)
                    .until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("div[id^='chat-messages-']")));
        } catch (TimeoutException e) {
            throw new RuntimeException("Couldn't find messages list");
        }
        // Start main execution here
        // Find last message at this time:
        String lastProcessedID = null;
        String lastMessageAuthor = null;
        WebElement lastProcessedElement = null;
        List<WebElement> temps = wd.findElements(By.cssSelector("div[id^='chat-messages-']"));
        lastProcessedElement = temps.get(temps.size() - 1);
        lastProcessedID = lastProcessedElement.getAttribute("id");
        // Get last message's author
        for (int i = 1;; i++) {
            if (i > temps.size()) {
                throw new RuntimeException("Cannot get author of last message");
            }
            lastProcessedElement = temps.get(temps.size() - i);
            List<WebElement> anotherTemps = wd.findElements(By.cssSelector("#" + lastProcessedElement.getAttribute("id")
                    + ">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']"));
            if (anotherTemps.size() != 0) {
                lastMessageAuthor = anotherTemps.get(0).getText();
                System.out.println("Initial last message's author: " + lastMessageAuthor);
                lastProcessedElement = null; // This variable is no longer used for the rest of the method
                break;
            }
        }
        System.out.println("Starting from id: " + lastProcessedID);
        while (continueExecution) {
            temps = wd.findElements(By.cssSelector("div[id^='chat-messages-']"));
            String currentLastProcessedID = temps.get(temps.size() - 1).getAttribute("id");

            // Construct dequeue of new messages (DO IT QUICK BEFORE DOM UPDATES!)
            Deque<String> messageIDsToInspect = new ArrayDeque<>();
            for (int i = 1;; i++) {
                String currentElementID = temps.get(temps.size() - i).getAttribute("id");
                if (currentElementID.equalsIgnoreCase(lastProcessedID)) {
                    break;
                }
                messageIDsToInspect.addFirst(currentElementID);
            }
            lastProcessedID = currentLastProcessedID;
            while (!messageIDsToInspect.isEmpty()) {
                String currentMsgID = messageIDsToInspect.pop();

                // Update last message sent if any
                List<WebElement> anotherTemps = wd.findElements(By.cssSelector("#" + currentMsgID
                        + ">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']"));
                if (anotherTemps.size() != 0) {
                    lastMessageAuthor = anotherTemps.get(0).getText();
                }

                // Get message body
                try {
                    temp = wd.findElement(
                            By.cssSelector("#" + currentMsgID + ">div[class^='contents']>div[class^='markup']"));
                } catch (NoSuchElementException e) {
                    throw new RuntimeException("Cannot find message body");
                }
                String messageContent = temp.getText();

                if (debug)
                    System.out.println("Msg: " + messageContent);

                // Check if contains any bye signs
                if (_containsBye(messageContent) && !lastMessageAuthor.equalsIgnoreCase(env.get("DISCORD_USERNAME"))) {
                    if (debug)
                        System.out.println("Reacting to msg id " + currentMsgID);
                    // React with :wave:
                    temp = wd.findElement(By.cssSelector("#" + currentMsgID));
                    new Actions(wd).moveToElement(temp).moveByOffset(10, 0).perform();
                    try {
                        temp = wd.findElement(By.cssSelector("#" + currentMsgID
                                + ">div[class^='buttonContainer']>div[class^='buttons']>div[class^='wrapper']>div[class^='button'][aria-label='Add Reaction']"));
                    } catch (NoSuchElementException e) {
                        throw new RuntimeException("Cannot find add reaction button");
                    }
                    temp.click();
                    try {
                        temp = wd.findElement(By.cssSelector(
                                "#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']"));

                    } catch (NoSuchElementException e) {
                        throw new RuntimeException("Cannot find reaction search bar");
                    }
                    temp.click();
                    temp.sendKeys("wa" + Keys.ENTER); // "wa" from "wave" is enough to default pick wave emoji
                }
            }
        }

        if (!debug) {
            wd.quit();
        } else {
            System.out.println("Press enter to close");
            Scanner sc = new Scanner(System.in);
            sc.nextLine();
            sc.close();
            wd.quit();
        }
        System.out.println("Api Execution end");
    }

    private boolean _containsBye(String s) {
        if (s.toLowerCase().contains("bye")) {
            return true;
        } else if (s.toLowerCase().contains("night")) {
            return true;
        } else if (s.toLowerCase().contains("good evening")) {
            return true;
        } else if (s.toLowerCase().contains("signing off")) {
            return true;
        }
        return false;
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

            for (Date d = new Date(); d.before(sevenPMToday) || SignoffAutomatorApi.debug; d = new Date()) {
                try {
                    Thread.sleep(1000);
                } catch (Exception e) {
                    System.out.println("cannot sleep thread for 1s");
                }
                // if (SignoffAutomatorApi.debug) {
                // System.out.println(d.toString());
                // }
            }
            SignoffAutomatorApi.continueExecution = false;
            System.out.println("AutoCloseTimer Execution end");
        }
    }

    public static boolean getDebug() {
        return SignoffAutomatorApi.debug;
    }

    public static void resetDebug() {
        SignoffAutomatorApi.debug = false;
    }
}
