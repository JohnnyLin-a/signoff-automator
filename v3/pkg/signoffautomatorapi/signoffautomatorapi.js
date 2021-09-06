const selenium = require('selenium-driver');

class SignoffAutomatorApi {
    static debug = false;
    #env = {
        DISCORD_LOGIN: "",
        DISCORD_PASSWORD: "",
        DISCORD_SERVER_ID: "",
        DISCORD_CHANNEL_ID: "",
        DISCORD_USERNAME: "",
    }
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
        }if (process.env.DISCORD_SERVER_ID) {
            this.#env.DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID
        } else {
            throw { message: "no DISCORD_SERVER_ID env var"}
        }if (process.env.DISCORD_CHANNEL_ID) {
            this.#env.DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID
        } else {
            throw { message: "no DISCORD_CHANNEL_ID env var"}
        }if (process.env.DISCORD_USERNAME) {
            this.#env.DISCORD_USERNAME = process.env.DISCORD_USERNAME
        } else {
            throw { message: "no DISCORD_USERNAME env var"}
        }if (process.env.DEBUG) {
            debug = process.env.DEBUG.toLowerCase() === "true"
        }
    };

    /**
     * @throws Will throw an exception with prop "message" if there is an execution error
     */
    execute() {
        
    }
    /**
     * @returns {boolean}
     */
    static getDebug() {
        return debug
    }

    static resetDebug() {
        debug = false
    }
}

module.exports = SignoffAutomatorApi;