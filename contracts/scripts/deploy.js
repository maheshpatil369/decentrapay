const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeploying to: ${network.name}`);
  console.log(`Deployer:     ${deployer.address}`);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:      ${ethers.formatEther(bal)} ETH\n`);

  const Factory = await ethers.getContractFactory("DecentraPay");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ DecentraPay deployed: ${address}`);

  // Write deployment info for frontend to consume
  const info = {
    address,
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "../../frontend/src/abi");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deployment.json"), JSON.stringify(info, null, 2));
  console.log(`\n📄 Deployment info → frontend/src/abi/deployment.json`);

  if (network.name === "sepolia") {
    console.log(`\n🔍 Verify: npx hardhat verify --network sepolia ${address}`);
    console.log(`🌐 Explorer: https://sepolia.etherscan.io/address/${address}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
