const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DecentraPay", () => {
  let contract, owner, alice, bob, carol;

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();
    const F = await ethers.getContractFactory("DecentraPay");
    contract = await F.deploy();
  });

  describe("sendPayment", () => {
    const ONE = ethers.parseEther("1");

    it("transfers ETH to recipient", async () => {
      const before = await ethers.provider.getBalance(bob.address);
      await contract.connect(alice).sendPayment(bob.address, "test", { value: ONE });
      const after = await ethers.provider.getBalance(bob.address);
      expect(after - before).to.equal(ONE);
    });

    it("emits PaymentSent", async () => {
      await expect(contract.connect(alice).sendPayment(bob.address, "hi", { value: ONE }))
        .to.emit(contract, "PaymentSent")
        .withArgs(alice.address, bob.address, ONE, "hi", (ts) => ts > 0n);
    });

    it("updates walletStats", async () => {
      await contract.connect(alice).sendPayment(bob.address, "", { value: ONE });
      const [sent,,count] = await contract.walletStats(alice.address);
      expect(sent).to.equal(ONE);
      expect(count).to.equal(1n);
    });

    it("reverts ZeroValue", async () => {
      await expect(contract.connect(alice).sendPayment(bob.address, "", { value: 0 }))
        .to.be.revertedWithCustomError(contract, "ZeroValue");
    });

    it("reverts ZeroAddress", async () => {
      await expect(contract.connect(alice).sendPayment(ethers.ZeroAddress, "", { value: ONE }))
        .to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("reverts MessageTooLong", async () => {
      await expect(contract.connect(alice).sendPayment(bob.address, "x".repeat(257), { value: ONE }))
        .to.be.revertedWithCustomError(contract, "MessageTooLong");
    });
  });

  describe("splitPayment", () => {
    it("distributes ETH correctly", async () => {
      const amounts = [ethers.parseEther("0.6"), ethers.parseEther("0.4")];
      const total   = amounts[0] + amounts[1];
      const bBefore = await ethers.provider.getBalance(bob.address);
      const cBefore = await ethers.provider.getBalance(carol.address);

      await contract.connect(alice).splitPayment(
        [bob.address, carol.address], amounts, "Dinner", { value: total }
      );

      expect(await ethers.provider.getBalance(bob.address)   - bBefore).to.equal(amounts[0]);
      expect(await ethers.provider.getBalance(carol.address) - cBefore).to.equal(amounts[1]);
    });

    it("reverts ValueMismatch", async () => {
      await expect(
        contract.connect(alice).splitPayment(
          [bob.address], [ethers.parseEther("1")], "", { value: ethers.parseEther("0.5") }
        )
      ).to.be.revertedWithCustomError(contract, "ValueMismatch");
    });
  });
});
