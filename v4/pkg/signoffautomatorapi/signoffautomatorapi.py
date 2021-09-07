

class SignoffAutomatorApi:
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
    