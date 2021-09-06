const {Builder, WebDriver} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const { Driver } = require('selenium-webdriver/chrome');

class SignoffAutomatorApi {
    static #debug = false
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
            throw { message: "no DISCORD_LOGIN env var"}
        }
        if (process.env.DISCORD_PASSWORD) {
            this.#env.DISCORD_PASSWORD = process.env.DISCORD_PASSWORD
        } else {
            throw { message: "no DISCORD_PASSWORD env var"}
        }
        if (process.env.DISCORD_SERVER_ID) {
            this.#env.DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID
        } else {
            throw { message: "no DISCORD_SERVER_ID env var"}
        }
        if (process.env.DISCORD_CHANNEL_ID) {
            this.#env.DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID
        } else {
            throw { message: "no DISCORD_CHANNEL_ID env var"}
        }
        if (process.env.DISCORD_USERNAME) {
            this.#env.DISCORD_USERNAME = process.env.DISCORD_USERNAME
        } else {
            throw { message: "no DISCORD_USERNAME env var"}
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
            throw { message: "profile doesnt exist"}
        }

        console.log("Creating profile object")
        let ffOptions = new firefox.Options()
        ffOptions.setProfile("../profile")

        console.log("Start autoclose thread (timeout in js)")
        this.#autoCloseTimer()

        console.log("Setting options")
        if (!SignoffAutomatorApi.#debug) {
            ffOptions.setHeadless(true)
        }
        /** @var {firefox.Driver} wd */
        let wd = new Builder()
            .forBrowser("firefox")
            .setFirefoxOptions(ffOptions)
            .build()
        
        // var temp selenium.WebElement
        console.log("GET discord.com")
        await wd.get("https://discord.com/channels/" + this.#env.DISCORD_SERVER_ID + "/" + this.#env.DISCORD_CHANNEL_ID)

        // Check if need to login
        console.log("Check login...")
        let currentURL = await wd.getCurrentUrl();
        if (currentURL.startsWith("https://discord.com/login")) {
            console.log("Need to login...")
        //     temp, err = wd.FindElement(selenium.ByCSSSelector, "input[aria-label='Email or Phone Number'][name='email'][type='text']")
        //     if err != nil {
        //         return errors.New("cannot find login input")
        //     }
        //     err = temp.Click()
        //     if err != nil {
        //         return errors.New("cannot focus login input")
        //     }
        //     err = temp.SendKeys(os.Getenv("DISCORD_LOGIN"))
        //     if err != nil {
        //         return errors.New("cannot type in login")
        //     }
        //     temp, err = wd.FindElement(selenium.ByCSSSelector, "input[aria-label='Password'][name='password'][type='password']")
        //     if err != nil {
        //         return errors.New("cannot find password input")
        //     }
        //     err = temp.Click()
        //     if err != nil {
        //         return errors.New("cannot focus password input")
        //     }
        //     err = temp.SendKeys(os.Getenv("DISCORD_PASSWORD") + selenium.EnterKey)
        //     if err != nil {
        //         return errors.New("cannot type in password")
        //     }
        }
        // temp = nil

        // err = wd.WaitWithTimeout(func(wd selenium.WebDriver) (bool, error) {
        //     t, _ := wd.CurrentURL()
        //     if strings.HasPrefix(t, "https://discord.com/channels") {
        //         return true, nil
        //     }
        //     return false, nil
        // }, 30*time.Second)
        // if err != nil {
        //     return errors.New("stuck at login, didn't jump to channels")
        // }
        // // Wait for messages to appear
        // err = wd.WaitWithTimeout(func(wd selenium.WebDriver) (bool, error) {
        //     t, err := wd.FindElements(selenium.ByCSSSelector, "div[id^='chat-messages-']")
        //     if err != nil {
        //         return false, nil
        //     }
        //     if len(t) > 0 {
        //         return true, nil
        //     }
        //     return false, nil
        // }, 30*time.Second)
        // if err != nil {
        //     return errors.New("cannot get messageIDs after 30 seconds")
        // }
        // // Start main execution here
        // // Find last message at this time:
        // var lastProcessedID string
        // var lastMessageAuthor string
        // var lastProcessedElement selenium.WebElement
        // temps, err := wd.FindElements(selenium.ByCSSSelector, "div[id^='chat-messages-']")
        // if err != nil || len(temps) == 0 {
        //     return errors.New("cannot get messageIDs a second time!?")
        // }
        // lastProcessedElement = temps[len(temps)-1]
        // lastProcessedID, err = lastProcessedElement.GetAttribute("id")
        // if err != nil {
        //     return errors.New("cannot get lastProcessedID")
        // }
        // // Get last message's author
        // for i := 1; ; i++ {
        //     if i > len(temps) {
        //         return errors.New("cannot get author of last message")
        //     }
        //     lastProcessedElement = temps[len(temps)-i]
        //     lastProcessedElementID, _ := lastProcessedElement.GetAttribute("id")
        //     anotherTemps, err := wd.FindElements(selenium.ByCSSSelector, "#"+lastProcessedElementID+">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']")
        //     if err != nil {
        //         return errors.New("cannot get anotherTemps")
        //     }
        //     if len(anotherTemps) != 0 {
        //         lastMessageAuthor, _ = anotherTemps[0].Text()
        //         console.log("Initial last message's author: " + lastMessageAuthor)
        //         lastProcessedElement = nil // This variable is no longer used for the rest of the method
        //         break
        //     }
        // }
        // console.log("Starting from id: " + lastProcessedID)
        // for continueExecution {
        //     temps, _ = wd.FindElements(selenium.ByCSSSelector, "div[id^='chat-messages-']")
        //     currentLastProcessedID, _ := temps[len(temps)-1].GetAttribute("id")

        //     // Construct dequeue of new messages (DO IT QUICK BEFORE DOM UPDATES!)
        //     messageIDsToInspect := []string{}
        //     for i := 1; ; i++ {
        //         currentElementID, _ := temps[len(temps)-i].GetAttribute("id")
        //         if currentElementID == lastProcessedID {
        //             break
        //         }
        //         messageIDsToInspect = append([]string{currentElementID}, messageIDsToInspect...)
        //     }

        //     lastProcessedID = currentLastProcessedID
        //     for len(messageIDsToInspect) != 0 {
        //         var currentMsgID string
        //         currentMsgID, messageIDsToInspect = messageIDsToInspect[0], messageIDsToInspect[1:]

        //         // Update last message sent if any
        //         anotherTemps, _ := wd.FindElements(selenium.ByCSSSelector, "#"+currentMsgID+">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']")
        //         if len(anotherTemps) != 0 {
        //             lastMessageAuthor, _ = anotherTemps[0].Text()
        //         }

        //         // Get message body
        //         temp, err = wd.FindElement(selenium.ByCSSSelector, "#"+currentMsgID+">div[class^='contents']>div[class^='markup']")
        //         if err != nil {
        //             return errors.New("cannot find message body")
        //         }
        //         messageContent, _ := temp.Text()

        //         if debug {
        //             console.log("Msg: " + messageContent)
        //         }
        //         // Check if contains any bye signs
        //         if containsBye(messageContent) && lastMessageAuthor != os.Getenv("DISCORD_USERNAME") {
        //             if debug {
        //                 console.log("Reacting to msg id " + currentMsgID)
        //             }
        //             // React with :wave:
        //             temp, _ = wd.FindElement(selenium.ByCSSSelector, "#"+currentMsgID)
        //             temp.Click()
        //             temp.SendKeys(selenium.RightArrowKey)
        //             temp2, err := wd.FindElement(selenium.ByCSSSelector, "#"+currentMsgID+">div[class^='buttonContainer']>div[class^='buttons']>div[class^='wrapper']>div[class^='button'][aria-label='Add Reaction']")
        //             if err != nil {
        //                 return errors.New("cannot find add reaction button")
        //             }
        //             temp2.Click()
        //             temp2.Click()
        //             err = wd.WaitWithTimeoutAndInterval(func(wd selenium.WebDriver) (bool, error) {
        //                 _, err := wd.FindElement(selenium.ByCSSSelector, ("#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']"))
        //                 if err != nil {
        //                     temp.Click()
        //                     temp.SendKeys(selenium.RightArrowKey)
        //                     temp2.Click()
        //                     temp2.Click()
        //                     return false, nil
        //                 }
        //                 return true, nil
        //             }, 10*time.Second, time.Second/2)
        //             if err != nil {
        //                 // Skip cuz golang is iffy cuz of selenium server java
        //                 continue
        //             }

        //             temp, err = wd.FindElement(selenium.ByCSSSelector, ("#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']"))
        //             if err != nil {
        //                 return errors.New("cannot find reaction search bar")
        //             }
        //             temp.Click()
        //             temp.SendKeys("wav" + selenium.EnterKey) // "wav" from "wave" is enough to default pick wave emoji
        //         }

        //     }
        // }
        // console.log("Api Execution end")
        // return nil
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
        setTimeout(() => {
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

    static resetDebug() {
        SignoffAutomatorApi.#debug = false
    }
}

module.exports = SignoffAutomatorApi;