const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken");
const RelayContract = artifacts.require("Relay");

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1";
const FOUNDING_TEAM_WALLET_ADDRESS =
  "0x001b0a8A4749C70AEAD435Cf7E6dA06A7bAd1a2d";
const decimal = new web3.utils.BN("1000000000000000000");

contract("Wallet", (accounts) => {
  let lively;
  let relay;

  before(async () => {
    lively = await LivelyToken.deployed();
    relay = await RelayContract.new(lively.address);

    // init consensus role
    await lively.firstInitializeConsensusRole(relay.address);
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
    const allowance = await lively.allowance(PUBLIC_SALE_WALLET, relay.address);
    const balance = await lively.balanceOf(accounts[5]);

    // when
    const requestObj = await lively.transferFrom.request(
      PUBLIC_SALE_WALLET,
      accounts[5],
      1000
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(balance.toString(), "1000");
    assert.equal(
      allowance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.allowance(PUBLIC_SALE_WALLET, relay.address);
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
      relay.address
    );
    const balance = await lively.balanceOf(accounts[6]);

    // when
    const requestObj = await lively.transferFrom.request(
      FOUNDING_TEAM_WALLET_ADDRESS,
      accounts[6],
      1000
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
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
      relay.address
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
