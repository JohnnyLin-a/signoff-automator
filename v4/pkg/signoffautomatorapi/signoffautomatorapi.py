import threading

class SignoffAutomatorApi:
    __debug = False
    __continueExecution = True
    __stopThread = False
    def __init__(self):
        self.debug = False
    
    def execute(self):
        raise RuntimeError("Test")

    def __containsBye(self, s: str):
        if "bye" in s.lower():
            return True
        elif "night" in s.lower():
            return True
        elif "good evening" in s.lower():
            return True
        elif "signing off" in s.lower():
            return True
        return False

    class __AutoCloseTimer(threading.Thread):
        def __init__(self):
            threading.Thread.__init__(self)
            self.name = "AutoCloseTimer"
        def run(self):
            SignoffAutomatorApi.__continueExecution = False
    
    @staticmethod
    def getDebug():
        return SignoffAutomatorApi.__debug
    @staticmethod
    def resetTimeout():
        SignoffAutomatorApi.__stopThread = True
    