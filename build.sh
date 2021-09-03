#!/bin/bash
docker buildx build --load -t maven-jdk-16 -f Dockerfile.build .
docker run --rm -v $(pwd):/root/src -w /root/src maven-jdk-16 bash -c "/usr/share/maven/bin/mvn package"