#!/bin/bash
docker buildx build --load -t maven-build-16 -f Dockerfile.build .
docker run --rm -v $(pwd):/root/src -w /root/src maven-build-16 bash -c "/usr/share/maven/bin/mvn package"