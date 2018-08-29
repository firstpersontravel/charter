#!/bin/bash

# Set env variables.
# set some env variable on every login
cat << EOF >> /etc/profile.d/env-vars.sh
  export PROJECT="{{ PROJECT }}"
  export STAGE="{{ STAGE }}"
  export ROLE="{{ ROLE }}"
EOF
source /etc/profile.d/env-vars.sh

export DEBIAN_FRONTEND=noninteractive

# Set up root
mkdir /home/root
chown ubuntu:ubuntu /home/ubuntu/.s3cfg

groupadd {{ USERGROUP }}
echo "%{{ USERGROUP }} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
