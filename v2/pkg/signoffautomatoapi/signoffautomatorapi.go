package signoffautomatoapi

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/tebeka/selenium"
	"github.com/tebeka/selenium/firefox"
)

var (
	debug             = false
	continueExecution = true
)

func Init() error {
	if _, ok := os.LookupEnv("DISCORD_LOGIN"); !ok {
		return errors.New("no DISCORD_LOGIN env var set")
	}
	if _, ok := os.LookupEnv("DISCORD_PASSWORD"); !ok {
		return errors.New("no DISCORD_PASSWORD env var set")
	}
	if _, ok := os.LookupEnv("DISCORD_SERVER_ID"); !ok {
		return errors.New("no DISCORD_SERVER_ID env var set")
	}
	if _, ok := os.LookupEnv("DISCORD_CHANNEL_ID"); !ok {
		return errors.New("no DISCORD_CHANNEL_ID env var set")
	}
	if _, ok := os.LookupEnv("DISCORD_USERNAME"); !ok {
		return errors.New("no DISCORD_USERNAME env var set")
	}
	if t, ok := os.LookupEnv("DEBUG"); ok {
		var err error
		debug, err = strconv.ParseBool(t)
		if err != nil {
			return errors.New("DEBUG env var parse error, must be a boolean")
		}
	}
	return nil
}

func Execute() error {
	// Load Profile
	log.Println("Attempt to load profile")

	if stat, err := os.Stat("../profile"); !(err == nil && stat.IsDir()) {
		return errors.New("cannot find profile folder")
	}

	log.Println("Creating profile object")
	// FirefoxProfile ffProfile = new FirefoxProfile(f)
	ffCapabilities := firefox.Capabilities{}
	ffCapabilities.SetProfile("../profile")

	log.Println("Start autoclose thread")
	go autoCloseTimer()

	log.Println("Setting options")
	if !debug {
		ffCapabilities.Args = []string{"--headless"}
	}

	log.Println("Init webdriver")
	const (
		seleniumPath    = "deps/selenium-server-standalone-3.141.59.jar"
		geckoDriverPath = "/usr/bin/geckodriver"
		port            = 4444
	)
	selenium.SetDebug(false)
	opts := []selenium.ServiceOption{}
	if debug {
		opts = append(opts, selenium.Output(os.Stderr))
	}
	service, err := selenium.NewGeckoDriverService(geckoDriverPath, port, opts...)
	if err != nil {
		return errors.New("cannot init selenium service")
	}
	defer service.Stop()
	caps := selenium.Capabilities{}
	caps.AddFirefox(ffCapabilities)
	wd, err := selenium.NewRemote(caps, "http://localhost:"+strconv.Itoa(port))
	if err != nil {
		return errors.New("cannot start selenium service " + err.Error())
	}
	defer wd.Quit()
	var temp selenium.WebElement
	log.Println("GET discord.com")
	wd.Get("https://discord.com/channels/" + os.Getenv("DISCORD_SERVER_ID") + "/" + os.Getenv("DISCORD_CHANNEL_ID"))

	// Check if need to login
	log.Println("Check login...")
	currentURL, _ := wd.CurrentURL()
	if strings.HasPrefix(currentURL, "https://discord.com/login") {
		log.Println("Need to login...")
		temp, err = wd.FindElement(selenium.ByCSSSelector, "input[aria-label='Email or Phone Number'][name='email'][type='text']")
		if err != nil {
			return errors.New("cannot find login input")
		}
		err = temp.Click()
		if err != nil {
			return errors.New("cannot focus login input")
		}
		err = temp.SendKeys(os.Getenv("DISCORD_LOGIN"))
		if err != nil {
			return errors.New("cannot type in login")
		}
		temp, err = wd.FindElement(selenium.ByCSSSelector, "input[aria-label='Password'][name='password'][type='password']")
		if err != nil {
			return errors.New("cannot find password input")
		}
		err = temp.Click()
		if err != nil {
			return errors.New("cannot focus password input")
		}
		err = temp.SendKeys(os.Getenv("DISCORD_PASSWORD") + selenium.EnterKey)
		if err != nil {
			return errors.New("cannot type in password")
		}
	}
	temp = nil

	err = wd.WaitWithTimeout(func(wd selenium.WebDriver) (bool, error) {
		t, _ := wd.CurrentURL()
		if strings.HasPrefix(t, "https://discord.com/channels") {
			return true, nil
		}
		return false, nil
	}, 30*time.Second)
	if err != nil {
		return errors.New("stuck at login, didn't jump to channels")
	}
	// Wait for messages to appear
	err = wd.WaitWithTimeout(func(wd selenium.WebDriver) (bool, error) {
		t, err := wd.FindElements(selenium.ByCSSSelector, "div[id^='chat-messages-']")
		if err != nil {
			return false, nil
		}
		if len(t) > 0 {
			return true, nil
		}
		return false, nil
	}, 30*time.Second)
	if err != nil {
		return errors.New("cannot get messageIDs after 30 seconds")
	}
	// Start main execution here
	// Find last message at this time:
	var lastProcessedID string
	var lastMessageAuthor string
	var lastProcessedElement selenium.WebElement
	temps, err := wd.FindElements(selenium.ByCSSSelector, "div[id^='chat-messages-']")
	if err != nil || len(temps) == 0 {
		return errors.New("cannot get messageIDs a second time!?")
	}
	lastProcessedElement = temps[len(temps)-1]
	lastProcessedID, err = lastProcessedElement.GetAttribute("id")
	if err != nil {
		return errors.New("cannot get lastProcessedID")
	}
	// Get last message's author
	for i := 1; ; i++ {
		if i > len(temps) {
			return errors.New("cannot get author of last message")
		}
		lastProcessedElement = temps[len(temps)-i]
		lastProcessedElementID, _ := lastProcessedElement.GetAttribute("id")
		anotherTemps, err := wd.FindElements(selenium.ByCSSSelector, "#"+lastProcessedElementID+">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']")
		if err != nil {
			return errors.New("cannot get anotherTemps")
		}
		if len(anotherTemps) != 0 {
			lastMessageAuthor, _ = anotherTemps[0].Text()
			log.Println("Initial last message's author: " + lastMessageAuthor)
			lastProcessedElement = nil // This variable is no longer used for the rest of the method
			break
		}
	}
	log.Println("Starting from id: " + lastProcessedID)
	for continueExecution {
		temps, _ = wd.FindElements(selenium.ByCSSSelector, "div[id^='chat-messages-']")
		currentLastProcessedID, _ := temps[len(temps)-1].GetAttribute("id")

		// Construct dequeue of new messages (DO IT QUICK BEFORE DOM UPDATES!)
		messageIDsToInspect := []string{}
		for i := 1; ; i++ {
			currentElementID, _ := temps[len(temps)-i].GetAttribute("id")
			if currentElementID == lastProcessedID {
				break
			}
			messageIDsToInspect = append([]string{currentElementID}, messageIDsToInspect...)
		}

		lastProcessedID = currentLastProcessedID
		for len(messageIDsToInspect) != 0 {
			var currentMsgID string
			currentMsgID, messageIDsToInspect = messageIDsToInspect[0], messageIDsToInspect[1:]

			// Update last message sent if any
			anotherTemps, _ := wd.FindElements(selenium.ByCSSSelector, "#"+currentMsgID+">div[class^='contents']>h2[class^='header']>span[class^='headerText']>span[class^='username']")
			if len(anotherTemps) != 0 {
				lastMessageAuthor, _ = anotherTemps[0].Text()
			}

			// Get message body
			temp, err = wd.FindElement(selenium.ByCSSSelector, "#"+currentMsgID+">div[class^='contents']>div[class^='markup']")
			if err != nil {
				return errors.New("cannot find message body")
			}
			messageContent, _ := temp.Text()

			if debug {
				log.Println("Msg: " + messageContent)
			}
			// Check if contains any bye signs
			if containsBye(messageContent) && lastMessageAuthor != os.Getenv("DISCORD_USERNAME") {
				if debug {
					log.Println("Reacting to msg id " + currentMsgID)
				}
				// React with :wave:
				temp, _ = wd.FindElement(selenium.ByCSSSelector, "#"+currentMsgID)
				temp.Click()
				temp.SendKeys(selenium.RightArrowKey)
				temp2, err := wd.FindElement(selenium.ByCSSSelector, "#"+currentMsgID+">div[class^='buttonContainer']>div[class^='buttons']>div[class^='wrapper']>div[class^='button'][aria-label='Add Reaction']")
				if err != nil {
					return errors.New("cannot find add reaction button")
				}
				temp2.Click()
				temp2.Click()
				err = wd.WaitWithTimeoutAndInterval(func(wd selenium.WebDriver) (bool, error) {
					_, err := wd.FindElement(selenium.ByCSSSelector, ("#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']"))
					if err != nil {
						temp.Click()
						temp.SendKeys(selenium.RightArrowKey)
						temp2.Click()
						temp2.Click()
						return false, nil
					}
					return true, nil
				}, 10*time.Second, time.Second/2)
				if err != nil {
					// Skip cuz golang is iffy cuz of selenium server java
					continue
				}

				temp, err = wd.FindElement(selenium.ByCSSSelector, ("#emoji-picker-tab-panel>div[class^='emojiPicker']>div[class^='header']>div[class^='searchBar']>div[class^='inner']>input[class^='input']"))
				if err != nil {
					return errors.New("cannot find reaction search bar")
				}
				temp.Click()
				time.Sleep(time.Second)
				temp.SendKeys("wav") // "wav" from "wave" is enough to default pick wave emoji
				time.Sleep(time.Second * 3)
				// Can't just send keys to wd... what a weird way to send an enter key
				wd.KeyDown(selenium.EnterKey)
				wd.KeyUp(selenium.EnterKey)
			}

		}
	}
	log.Println("Api Execution end")
	return nil
}

func IsDebug() bool {
	return debug
}

func ResetDebug() {
	debug = false
}

func containsBye(s string) bool {
	if strings.Contains(strings.ToLower(s), "bye") {
		return true
	} else if strings.Contains(strings.ToLower(s), "night") {
		return true
	} else if strings.Contains(strings.ToLower(s), "good evening") {
		return true
	} else if strings.Contains(strings.ToLower(s), "signing off") {
		return true
	} else if strings.Contains(strings.ToLower(s), "see you") {
		return true
	} else if strings.Contains(strings.ToLower(s), "heading out") {
		return true
	}
	return false
}

func autoCloseTimer() {
	ny, e := time.LoadLocation("America/New_York")
	if e != nil {
		panic("Cannot set time's location")
	}
	// Keep using In(ny) beacuse 5 hours can mean its a different day of the month
	now := time.Now().In(ny)
	sevenPMToday := time.Date(now.Year(), now.Month(), now.Day(), 19, 0, 0, 0, ny)

	var sleep time.Duration = 0
	if now.Before(sevenPMToday) {
		sleep = sevenPMToday.Sub(now)
	}
	if debug {
		log.Println("DEBUG: AutoCloseTimer 1hr")
		sleep = time.Hour
	}
	time.Sleep(sleep)
	continueExecution = false
	log.Println("AutoCloseTimer Execution end")
}
