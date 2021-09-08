#!/bin/bash
docker pull ghcr.io/johnnylin-a/signoff-automator-profile:latest
docker create --name ff_profile ghcr.io/johnnylin-a/signoff-automator-profile sh
docker cp ff_profile:/profile ./profile
docker rm ff_profile
docker image rm ghcr.io/johnnylin-a/signoff-automator-profile:latest