# ==============================================================================
# bootstrap_network.ps1
# Windows PowerShell Hyperledger Fabric Automation Script
# SIH 2026 Problem Statement 26105
# ==============================================================================

$ErrorActionPreference = "Stop"

$CHANNEL_NAME = "cyber-risk-channel"
$CC_NAME = "cyber_risk_audit"
$CC_VERSION = "1.0"
$CC_SEQUENCE = "1"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "    BOOTSTRAPPING HYPERLEDGER FABRIC PERMISSIONED NETWORK" -ForegroundColor Cyan
Write-Host "    Topology: 3 Raft Orderers, 2 Organization Peers, Raft Consensus" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker Desktop is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Hyperledger Fabric runs containerized services natively." -ForegroundColor Yellow
    Write-Host "Please install Docker Desktop for Windows with WSL2 backend enabled." -ForegroundColor Yellow
    Write-Host "See BLOCKCHAIN_SETUP.md for complete instructions." -ForegroundColor Yellow
    exit 1
}

# Step 1: Clean previous artifacts
Write-Host "[1/7] Cleaning previous crypto and channel artifacts..." -ForegroundColor Green
if (Test-Path "../crypto-config") { Remove-Item -Recurse -Force "../crypto-config" }
if (Test-Path "../channel-artifacts") { Remove-Item -Recurse -Force "../channel-artifacts" }
New-Item -ItemType Directory -Force -Path "../channel-artifacts" | Out-Null

# Step 2: Generate Cryptographic Materials
Write-Host "[2/7] Generating identities using cryptogen inside Docker..." -ForegroundColor Green
docker run --rm -v "${PWD}/..:/fabric" -w /fabric hyperledger/fabric-tools:2.5 `
    cryptogen generate --config=/fabric/crypto-config.yaml --output=/fabric/crypto-config

# Step 3: Generate Channel Genesis Block
Write-Host "[3/7] Generating genesis block with Raft consenter specifications..." -ForegroundColor Green
docker run --rm -v "${PWD}/..:/fabric" -e FABRIC_CFG_PATH=/fabric `
    hyperledger/fabric-tools:2.5 `
    configtxgen -profile CyberRiskChannelProfile `
                -outputBlock /fabric/channel-artifacts/${CHANNEL_NAME}.block `
                -channelID ${CHANNEL_NAME}

# Step 4: Start Network Containers
Write-Host "[4/7] Launching Fabric Docker Containers (3 Orderers, 2 Peers, CLI)..." -ForegroundColor Green
docker-compose -f ../docker-compose-fabric.yaml down -v --remove-orphans
docker-compose -f ../docker-compose-fabric.yaml up -d

Write-Host "Waiting 5 seconds for Raft consensus leader election..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 5: Join Orderers and Peers to Channel
Write-Host "[5/7] Joining nodes to channel '${CHANNEL_NAME}'..." -ForegroundColor Green
docker exec cli osnadmin channel join `
    --channelID ${CHANNEL_NAME} `
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block `
    -o orderer1.example.com:7053 `
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt `
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt `
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.key

# Join Org1 Peer
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

# Join Org2 Peer
docker exec -e CORE_PEER_LOCALMSPID="Org2MSP" `
            -e CORE_PEER_ADDRESS="peer0.org2.example.com:9051" `
            -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" `
            -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" `
            cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

# Step 6: Deploy Chaincode via Fabric 2.x Lifecycle
Write-Host "[6/7] Packaging, Installing, Approving and Committing Chaincode '${CC_NAME}'..." -ForegroundColor Green
docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz `
    --path /opt/gopath/src/github.com/chaincode `
    --lang node `
    --label ${CC_NAME}_${CC_VERSION}

# Install on Peer Org1
docker exec cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
$PACKAGE_ID = (docker exec cli peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz).Trim()

# Install on Peer Org2
docker exec -e CORE_PEER_LOCALMSPID="Org2MSP" `
            -e CORE_PEER_ADDRESS="peer0.org2.example.com:9051" `
            -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" `
            -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" `
            cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Approve for Org1
docker exec cli peer lifecycle chaincode approveformyorg `
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com `
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt `
    --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} `
    --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Approve for Org2
docker exec -e CORE_PEER_LOCALMSPID="Org2MSP" `
            -e CORE_PEER_ADDRESS="peer0.org2.example.com:9051" `
            -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" `
            -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" `
            cli peer lifecycle chaincode approveformyorg `
            -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com `
            --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt `
            --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} `
            --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Commit Chaincode definition
docker exec cli peer lifecycle chaincode commit `
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com `
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt `
    --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} `
    --sequence ${CC_SEQUENCE} `
    --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt `
    --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

# Step 7: Initialize Ledger
Write-Host "[7/7] Invoking initLedger transaction on channel..." -ForegroundColor Green
docker exec cli peer chaincode invoke `
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com `
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt `
    -C ${CHANNEL_NAME} -n ${CC_NAME} `
    --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt `
    -c '{\"function\":\"initLedger\",\"Args\":[]}'

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "    HYPERLEDGER FABRIC MULTI-NODE NETWORK OPERATIONAL!" -ForegroundColor Cyan
Write-Host "    Channels: $CHANNEL_NAME" -ForegroundColor Cyan
Write-Host "    Consensus: Raft Ordering (3 Consenters Active)" -ForegroundColor Cyan
Write-Host "    Peers: Org1 (7051), Org2 (9051)" -ForegroundColor Cyan
Write-Host "    Chaincode: $CC_NAME v$CC_VERSION Committed" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
