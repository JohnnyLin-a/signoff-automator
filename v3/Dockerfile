FROM node:16-bullseye-slim AS node-lib

FROM ubuntu:20.04
ENV DEBIAN_FRONTEND="noninteractive" TZ="America/New_York"
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y tzdata firefox firefox-geckodriver && \
    rm -rf /var/lib/apt/lists/*
COPY --from=node-lib /usr/local/bin/node /usr/local/bin/node
ENV PATH=/usr/local/bin${PATH}