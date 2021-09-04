#!/bin/bash
FILE=deps/selenium-server-standalone-3.141.59.jar
if [[ ! -f "$FILE" ]]; then
    wget -P deps https://github.com/SeleniumHQ/selenium/releases/download/selenium-3.141.59/selenium-server-standalone-3.141.59.jar
fi

# TODO: docker image, build app, setup ubuntu ff