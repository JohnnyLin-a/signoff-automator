#!/bin/bash
FILE=deps/selenium-server-standalone-3.141.59.jar
if [[ ! -f "$FILE" ]]; then
    wget -P deps https://github.com/SeleniumHQ/selenium/releases/download/selenium-3.141.59/selenium-server-standalone-3.141.59.jar
fi

# TODO: docker image, build app, setup ubuntu ff
docker run --rm -w /root/src/v2 -v $(pwd):/root/src/v2 golang:1.17-bullseye bash -c "go build ./cmd/signoffautomator/signoffautomator.go"
docker buildx build --load -t ubuntu_ff .