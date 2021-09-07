import os 
from selenium import webdriver
from pkg.signoffautomatorapi.signoffautomatorapi import SignoffAutomatorApi

api = SignoffAutomatorApi()

try:
    api.execute()
except RuntimeError as e:
    print(e)
    os._exit(1)
#     console.log("Error when Executing api", message)
#     if (SignoffAutomatorApi.getDebug()) {
#         SignoffAutomatorApi.resetTimeout();
#     }
#     process.exit(1)
# }
# console.log("Main execution done");
# if (SignoffAutomatorApi.getDebug()) {
#     SignoffAutomatorApi.resetTimeout();
# }