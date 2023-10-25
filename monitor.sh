#!/bin/bash

# Declare an array of node names
declare -a nodes=("sentry0-ap-southeast-1-testnet"
                  "sentry0-eu-west-1-testnet"
                  "sentry0-us-east-1-testnet"
                  "sentry0-us-west-2-testnet"
                  "sentry1-ap-southeast-1-testnet"
                  "sentry1-eu-west-1-testnet"
                  "sentry1-us-east-1-testnet"
                  "sentry1-us-west-2-testnet"
                  "sentry2-us-east-1-testnet")

# Loop through each node in the array
for node in "${nodes[@]}"
do
  # Assuming that the IP address for each node is stored in a DNS that can resolve it
  # Using curl to fetch data and jq to parse JSON
  echo "Fetching data from $node:"
  curl -s --max-time 3  "http://$node:26657/consensus_state" | jq '.result.round_state."height/round/step"'
done

