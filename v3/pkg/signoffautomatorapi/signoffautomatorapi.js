const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');

class SignoffAutomatorApi {
    static #debug = false
    static #timeout = null
    #env = {
        DISCORD_LOGIN: "",
        DISCORD_PASSWORD: "",
        DISCORD_SERVER_ID: "",
        DISCORD_CHANNEL_ID: "",
        DISCORD_USERNAME: "",
    }
    #continueExecution = true
    /**
     * @throws Will throw an exception with prop "message" if init failed
     */
    constructor() {
        this.init()
    };

    init() {
        if (process.env.DISCORD_LOGIN) {
            this.#env.DISCORD_LOGIN = process.env.DISCORD_LOGIN
        } else {
            throw { message: "no DISCORD_LOGIN env var" }
        }
        if (process.env.DISCORD_PASSWORD) {
            this.#env.DISCORD_PASSWORD = process.env.DISCORD_PASSWORD
        } else {
            throw { message: "no DISCORD_PASSWORD env var" }
        }
        if (process.env.DISCORD_SERVER_ID) {
            this.#env.DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID
        } else {
            throw { message: "no DISCORD_SERVER_ID env var" }
        }
        if (process.env.DISCORD_CHANNEL_ID) {
            this.#env.DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID
        } else {
            throw { message: "no DISCORD_CHANNEL_ID env var" }
        }
        if (process.env.DISCORD_USERNAME) {
            this.#env.DISCORD_USERNAME = process.env.DISCORD_USERNAME
        } else {
            throw { message: "no DISCORD_USERNAME env var" }
        }
        if (process.env.DEBUG) {
            SignoffAutomatorApi.#debug = process.env.DEBUG.toLowerCase() === "true"
        }
    };

    /**
     * @throws Will throw an exception with prop "message" if there is an execution error
     */
    async execute() {
        // Load Profile
        console.log("Attempt to load profile")

        if (!fs.existsSync("../profile")) {
            throw { message: "profile doesnt exist" }
        }

        console.log("Creating profile object")
        let ffOptions = new firefox.Options()
        ffOptions.setProfile("../profile")
        ffOptions.addArguments(["--width=1920", "--height=1080"])

        console.log("Start autoclose thread (timeout in js)")
        this.#autoCloseTimer()

        console.log("Setting options")
        if (!SignoffAutomatorApi.#debug) {
            ffOptions.setHeadless(true)
        }

        let wd = await new Builder()
            .forBrowser("firefox")
            .setFirefoxOptions(ffOptions)
            .build()

        let temp
        let temp2
        console.log("GET discord.com")
        await wd.get("https://discord.com/channels/" + this.#env.DISCORD_SERVER_ID + "/" + this.#env.DISCORD_CHANNEL_ID)

        // Check if need to login
        console.log("Check login...")
        let currentURL = await wd.getCurrentUrl();
        if (currentURL.startsWith("https://discord.com/login")) {
            console.log("Need to login...")
            // findElement throws an exception for us if the element is not found
            temp = await wd.findElement(By.css("input[aria-label='Email or Phone Number'][name='email'][type='text']"))
            await temp.click();
            await temp.sendKeys(this.#env.DISCORD_LOGIN + Key.TAB + this.#env.DISCORD_PASSWORD + Key.ENTER)
        }
        temp = null

        try {
            await wd.wait(until.urlContains("https://discord.com/channels"), 30000)
        } catch (e) {
            throw { message: "stuck at login, didn't jump to channels" }
        }
        // Wait for messages to appear
        try {
            await wd.wait(until.elementLocated(By.css("div[id^='chat-messages-']")), 30000)
        } catch (e) {
            throw { message: "cannot get messageIDs after 30 seconds" }
        }
        // Start main execution here
        // Find last message at this time:
        let lastProcessedID
        let lastMessageAuthor
        let lastProcessedElement
        let temps
        let anotherTemps
        temps = await wd.findElements(By.css("div[id^='chat-messages-']"))
        if (temps.length == 0) {
            throw { message: "cannot get messageIDs a second time!?" }
        }
        lastProcessedElement = temps[temps.length - 1]
        lastProcessedID = await lastProcessedElement.getAttribute("id")
        // Get last message's author
        for (let i = 1; ; i++) {
            if (i > temps.length) {
                throw { message: "cannot get author of last message" }
            }
            lastProcessedElement = temps[temps.length - i]
            anotherTemps = await wd.findElements(By.css("#" + (await lastProcessedElement.getAttribute("id")) + ">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']"))
            if (anotherTemps.length != 0) {
                lastMessageAuthor = await anotherTemps[0].getText()
                console.log("Initial last message's author: " + lastMessageAuthor)
                lastProcessedElement = null // This variable is no longer used for the rest of the method
                break
            }
        }
        console.log("Starting from id: " + lastProcessedID)
        while (this.#continueExecution) {
            temps = await wd.findElements(By.css("div[id^='chat-messages-']"))
            let currentLastProcessedID = await temps[temps.length - 1].getAttribute("id")

            // Construct dequeue of new messages (DO IT QUICK BEFORE DOM UPDATES!)
            let messageIDsToInspect = []
            for (let i = 1; ; i++) {
                let currentElementID = await temps[temps.length - i].getAttribute("id")
                if (currentElementID == lastProcessedID) {
                    break
                }
                messageIDsToInspect.push(currentElementID)
            }

            lastProcessedID = currentLastProcessedID
            while (messageIDsToInspect.length != 0) {
                let currentMsgID = messageIDsToInspect.pop();
                // Update last message sent if any
                anotherTemps = await wd.findElements(By.css("#" + currentMsgID + ">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']"))
                if (anotherTemps.length != 0) {
                    lastMessageAuthor = await anotherTemps[0].getText()
                }

                // Get message body
                temp = await wd.findElement(By.css("#" + currentMsgID + ">div[class^='contents']>div[class^='markup']"))
                let messageContent = await temp.getText()

                if (SignoffAutomatorApi.#debug) {
                    console.log("Msg: " + messageContent)
                }
                // Check if contains any bye signs
                if (this.#containsBye(messageContent) && lastMessageAuthor != this.#env.DISCORD_USERNAME) {
                    if (SignoffAutomatorApi.#debug) {
                        console.log("Reacting to msg id " + currentMsgID)
                    }
                    // React with :wave:
                    temp = await wd.findElement(By.css("#" + currentMsgID))
                    // await wd.actions().move({ origin: temp }).move({ origin: temp, x: 30, y: 0 }).perform()
                    await wd.actions().move({ origin: temp }).move({ origin: temp, x: 30, y: -5 }).press().sendKeys(Key.ARROW_RIGHT).perform()
                    temp2 = await wd.findElement(By.css("#" + currentMsgID + ">div[class^='buttonContainer']>div[class^='buttons']>div[class^='wrapper']>div[class^='button'][aria-label='Add Reaction']"))
                    await wd.wait(until.elementLocated(By.css("#" + currentMsgID + ">div[class^='buttonContainer']>div[class^='buttons']>div[class^='wrapper']>div[class^='button'][aria-label='Add Reaction']")), 5000)
                    temp2.click()
                    temp2.click()
                    await wd.wait(until.elementLocated(By.css("#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']")), 5000)
                    temp = await wd.findElement(By.css(("#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']")))
                    temp.click()
                    temp.sendKeys("wav" + Key.ENTER) // "wav" from "wave" is enough to default pick wave emoji
                }
            }
        }
        console.log("Api Execution end")
    }

    /**
     * Check if string contains a sign of signoff
     * @param {string} s string to check
     * @returns {boolean} 
     */
    #containsBye(s) {
        if (s.toLowerCase().includes("bye")) {
            return true
        } else if (s.toLowerCase().includes("night")) {
            return true
        } else if (s.toLowerCase().includes("good evening")) {
            return true
        } else if (s.toLowerCase().includes("signing off")) {
            return true
        }
        return false
    }

    #autoCloseTimer() {
        // Docker image sets up New York time
        let now = new Date()

        let sevenPMToday = new Date();
        sevenPMToday.setHours(19, 0, 0, 0);

        let sleep;
        if (now < sevenPMToday) {
            // sleep is in ms
            sleep = now - sevenPMToday
        }
        if (SignoffAutomatorApi.#debug) {
            console.log("DEBUG: AutoCloseTimer 1hr")
            sleep = 3600000
        }
        SignoffAutomatorApi.#timeout = setTimeout(() => {
            SignoffAutomatorApi.#continueExecution = false
            console.log("AutoCloseTimer Execution end")
        }, sleep)
    }
    /**
     * @returns {boolean}
     */
    static getDebug() {
        return SignoffAutomatorApi.#debug
    }

    static resetTimeout() {
        if (SignoffAutomatorApi.#timeout != null) {
            clearTimeout(SignoffAutomatorApi.#timeout)
        }
    }
}

module.exports = SignoffAutomatorApi;