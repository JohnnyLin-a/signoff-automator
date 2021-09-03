FROM maven:3-adoptopenjdk-16 AS mvn-lib
FROM eclipse-temurin:16-focal AS jdk-lib

# maven binary location: /usr/share/maven/bin/mvn
# maven lib location: /usr/share/maven

FROM ubuntu:20.04
COPY --from=mvn-lib /usr/share/maven /usr/share/maven
COPY --from=jdk-lib /opt/java/openjdk /opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y firefox firefox-geckodriver