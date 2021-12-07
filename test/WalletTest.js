const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken");

// const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE");
// const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE");
// const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE");
// const NONE_ROLE = web3.utils.keccak256("NONE_ROLE");

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1";
const FOUNDING_TEAM_WALLET_ADDRESS =
  "0x001b0a8A4749C70AEAD435Cf7E6dA06A7bAd1a2d";
const decimal = new web3.utils.BN("1000000000000000000");

contract("Wallet", (accounts) => {
  let lively;

  before(async () => {
    lively = await LivelyToken.deployed();

    // init consensus role
    await lively.firstInitializeConsensusRole(accounts[1]);
  });

  it("Should ADMIN_ROLE transfer token from permited wallet to account", async () => {
    // given
    const allowance = await lively.allowance(PUBLIC_SALE_WALLET, accounts[0]);
    const balance = await lively.balanceOf(accounts[5]);

    // when
    await lively.transferFrom(PUBLIC_SALE_WALLET, accounts[5], 1000, {
      from: accounts[0],
    });

    // then
    assert.equal(balance.toString(), "0");
    assert.equal(
      allowance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.allowance(PUBLIC_SALE_WALLET, accounts[0]);
    assert.equal(
      result.toString(),
      allowance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[5]);
    assert.equal(
      result.toString(),
      balance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should ADMIN_ROLE could not transfer token from not permited wallet", async () => {
    // given
    const balance = await lively.balanceOf(accounts[5]);

    // when
    try {
      await lively.transferFrom(
        FOUNDING_TEAM_WALLET_ADDRESS,
        accounts[5],
        1000,
        { from: accounts[0] }
      );
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.equal(balance.toString(), "1000");

    // and
    const result = await lively.balanceOf(accounts[5]);
    assert.equal(result.toString(), balance.toString());
  });

  it("Should CONSENSUS_ROLE transfer token from PUBLIC_SALE_WALLET to account", async () => {
    // given
    const allowance = await lively.allowance(PUBLIC_SALE_WALLET, accounts[1]);
    const balance = await lively.balanceOf(accounts[5]);

    // when
    await lively.transferFrom(PUBLIC_SALE_WALLET, accounts[5], 1000, {
      from: accounts[1],
    });

    // then
    assert.equal(balance.toString(), "1000");
    assert.equal(
      allowance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.allowance(PUBLIC_SALE_WALLET, accounts[1]);
    assert.equal(
      result.toString(),
      allowance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[5]);
    assert.equal(
      result.toString(),
      balance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should CONSENSUS_ROLE transfer token from FOUNDING_TEAM_WALLET_ADDRESS to account", async () => {
    // given
    const allowance = await lively.allowance(
      FOUNDING_TEAM_WALLET_ADDRESS,
      accounts[1]
    );
    const balance = await lively.balanceOf(accounts[6]);

    // when
    await lively.transferFrom(FOUNDING_TEAM_WALLET_ADDRESS, accounts[6], 1000, {
      from: accounts[1],
    });

    // then
    assert.equal(balance.toString(), "0");
    assert.equal(
      allowance.toString(),
      new web3.utils.BN("200000000").mul(decimal).toString()
    );

    // and
    let result = await lively.allowance(
      FOUNDING_TEAM_WALLET_ADDRESS,
      accounts[1]
    );
    assert.equal(
      result.toString(),
      allowance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[6]);
    assert.equal(
      result.toString(),
      balance.add(new web3.utils.BN(1000)).toString()
    );
  });
});
