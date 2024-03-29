import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Escrow } from "./../typechain/Escrow.d";
import { RealEstate } from "./../typechain/RealEstate.d";

import { ethers } from "hardhat";
import { deployContract } from "../helpers/deployHelpers";

describe("Escrow.sol", () => {
  let accounts: SignerWithAddress[], lender: SignerWithAddress, inspector: SignerWithAddress, seller: SignerWithAddress;

  let escrow: Escrow;
  let realEstateNFT: RealEstate;

  // deploy contracts
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    lender = accounts[0];
    inspector = accounts[1];
    seller = accounts[2];

    realEstateNFT = await deployContract("RealEstate", undefined, false);

    escrow = await deployContract(
      "Escrow",
      {
        args: [realEstateNFT.address, seller.address, inspector.address, lender.address],
      },
      false
    );
  });

  describe("Successfully deployed", () => {
    it("should have the proper related addresses, after deployed", async () => {
      const lenderAddr = await escrow.lender();
      const inspectorAddr = await escrow.inspector();
      const sellerAddr = await escrow.seller();
      const nftAddr = await escrow.nftAddress();

      expect(lenderAddr).to.equal(lender.address);
      expect(inspectorAddr).to.equal(inspector.address);
      expect(sellerAddr).to.equal(seller.address);
      expect(nftAddr).to.equal(realEstateNFT.address);
    });

    it("should successfully list a NFT on the Escrow", async () => {
      // first, make the seller mint a new token

      await realEstateNFT.connect(seller).mint("https://google.com");

      // expect the owner of the token 1 to be the seller
      const tokenOwner = await realEstateNFT.ownerOf(1);

      expect(tokenOwner).to.equal(seller.address);

      // seller should approve transfer of the token to the escrow contract
      await realEstateNFT.connect(seller).approve(escrow.address, 1);

      // then, lets list the token on the escrow

      await escrow.connect(seller).list(1);

      // expect the token to be listed on the escrow

      const updatedTokenOwner = await realEstateNFT.ownerOf(1);

      expect(updatedTokenOwner).to.equal(escrow.address);
    });
  });
});
