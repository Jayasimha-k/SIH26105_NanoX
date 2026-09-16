#!/bin/bash
# ==============================================================================
# bootstrap_network.sh
# End-to-End Hyperledger Fabric Network Automation Script
# SIH 2026 Problem Statement 26105
# ==============================================================================

set -euo pipefail

CHANNEL_NAME="cyber-risk-channel"
CC_NAME="cyber_risk_audit"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_SRC_PATH="../chaincode"
FABRIC_CFG_PATH="${PWD}/.."

echo "========================================================================"
echo "    BOOTSTRAPPING HYPERLEDGER FABRIC PERMISSIONED NETWORK"
echo "    Topology: 3 Raft Orderers, 2 Organization Peers, Raft Consensus"
echo "========================================================================"

# Step 1: Clean previous artifacts
echo "[1/7] Cleaning previous crypto and channel artifacts..."
rm -rf ../crypto-config ../channel-artifacts
mkdir -p ../channel-artifacts

# Step 2: Generate Cryptographic Materials
echo "[2/7] Generating identities using cryptogen..."
if command -v cryptogen &> /dev/null; then
    cryptogen generate --config=../crypto-config.yaml --output=../crypto-config
else
    echo "Using Docker fabric-tools container for cryptogen..."
    docker run --rm -v "${PWD}:/fabric" -w /fabric hyperledger/fabric-tools:2.5 \
        cryptogen generate --config=/fabric/crypto-config.yaml --output=/fabric/crypto-config
fi

# Step 3: Generate Channel Genesis Block with Raft Consensus
echo "[3/7] Generating genesis block with Raft consenter specifications..."
if command -v configtxgen &> /dev/null; then
    export FABRIC_CFG_PATH="${PWD}/.."
    configtxgen -profile CyberRiskChannelProfile \
                -outputBlock ../channel-artifacts/${CHANNEL_NAME}.block \
                -channelID ${CHANNEL_NAME}
else
    echo "Using Docker fabric-tools container for configtxgen..."
    docker run --rm -v "${PWD}:/fabric" -e FABRIC_CFG_PATH=/fabric \
        hyperledger/fabric-tools:2.5 \
        configtxgen -profile CyberRiskChannelProfile \
                    -outputBlock /fabric/channel-artifacts/${CHANNEL_NAME}.block \
                    -channelID ${CHANNEL_NAME}
fi

# Step 4: Start Network Containers
echo "[4/7] Launching Fabric Docker Containers (3 Orderers, 2 Peers, CLI)..."
docker-compose -f docker-compose-fabric.yaml down -v --remove-orphans
docker-compose -f docker-compose-fabric.yaml up -d

echo "Waiting 5 seconds for Raft consensus leader election..."
sleep 5

# Step 5: Join Orderers and Peers to Channel
echo "[5/7] Joining nodes to channel '${CHANNEL_NAME}'..."
docker exec cli osnadmin channel join \
    --channelID ${CHANNEL_NAME} \
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
    -o orderer1.example.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.key

# Join Org1 Peer
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

# Join Org2 Peer
docker exec -e CORE_PEER_LOCALMSPID="Org2MSP" \
            -e CORE_PEER_ADDRESS="peer0.org2.example.com:9051" \
            -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
            -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" \
            cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

# Step 6: Deploy Chaincode via Fabric 2.x Lifecycle
echo "[6/7] Packaging, Installing, Approving and Committing Chaincode '${CC_NAME}'..."
docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz \
    --path /opt/gopath/src/github.com/chaincode \
    --lang node \
    --label ${CC_NAME}_${CC_VERSION}

# Install on Peer Org1
docker exec cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)

# Install on Peer Org2
docker exec -e CORE_PEER_LOCALMSPID="Org2MSP" \
            -e CORE_PEER_ADDRESS="peer0.org2.example.com:9051" \
            -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
            -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" \
            cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Approve for Org1
docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt \
    --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} \
    --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Approve for Org2
docker exec -e CORE_PEER_LOCALMSPID="Org2MSP" \
            -e CORE_PEER_ADDRESS="peer0.org2.example.com:9051" \
            -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
            -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" \
            cli peer lifecycle chaincode approveformyorg \
            -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
            --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt \
            --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} \
            --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Commit Chaincode definition
docker exec cli peer lifecycle chaincode commit \
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt \
    --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

# Step 7: Initialize Ledger
echo "[7/7] Invoking initLedger transaction on channel..."
docker exec cli peer chaincode invoke \
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt \
    -C ${CHANNEL_NAME} -n ${CC_NAME} \
    --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    -c '{"function":"initLedger","Args":[]}'

echo "========================================================================"
echo "    HYPERLEDGER FABRIC MULTI-NODE NETWORK OPERATIONAL!"
echo "    Channels: ${CHANNEL_NAME}"
echo "    Consensus: Raft Ordering (3 Consenters Active)"
echo "    Peers: Org1 (7051), Org2 (9051)"
echo "    Chaincode: ${CC_NAME} v${CC_VERSION} Committed"
echo "========================================================================"
