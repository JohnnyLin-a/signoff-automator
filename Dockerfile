FROM maven:3-eclipse-temurin-16 AS mvn-lib
FROM eclipse-temurin:16-focal AS jdk-lib

# maven binary location: /usr/share/maven/bin/mvn
# maven lib location: /usr/share/maven

FROM ubuntu:20.04
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y firefox firefox-geckodriver
COPY --from=mvn-lib /usr/share/maven /usr/share/maven
COPY --from=jdk-lib /opt/java/openjdk /opt/java/openjdk
ENV PATH="/usr/share/maven/bin:/opt/java/openjdk/bin:${PATH}"