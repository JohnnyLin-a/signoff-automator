const SignoffAutomatorApi = require('../../pkg/signoffautomatorapi/signoffautomatorapi.js')

let main = async function() {
    // Main execution
    try {
        var api = new SignoffAutomatorApi()
    } catch ({ message }) {
        console.log("Error when initializing api", message)
        process.exit(1)
    }
    try {
        await api.execute()
    } catch ({ message }) {
        console.log("Error when Executing api", message)
    }
    console.log("Main execution done");
    if (SignoffAutomatorApi.getDebug()) {
        SignoffAutomatorApi.resetDebug();
    }
}

main();