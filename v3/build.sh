#!/bin/bash
docker run --rm -v $(pwd)/..:/root/src -w /root/src/v3 node:16-bullseye-slim bash -c "yarn install"
docker buildx build --load -t node_ubuntu_ff .