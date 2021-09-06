#!/bin/bash
docker run --rm -v $(pwd)/..:/root/src/v3 node:16-alpine sh -c "yarn install"
docker buildx build --load -t node_tz .