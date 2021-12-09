const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken");
const RelayContract = artifacts.require("Relay");

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1";

const decimal = new web3.utils.BN("1000000000000000000");

contract("Freezable", (accounts) => {
  let lively;
  let relay;

  before(async () => {
    lively = await LivelyToken.deployed();
    relay = await RelayContract.new(lively.address);

    // init consensus role
    await lively.firstInitializeConsensusRole(relay.address);
  });

  it("Should CONSENSUS_ROLE freezeFrom token from account", async () => {
    // given
    const freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);

    // when
    const requestObj = await lively.freezeFrom.request(
      PUBLIC_SALE_WALLET,
      freezeBalance,
      1000
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(freezeBalance.toString(), "0");
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
    assert.equal(
      result.toString(),
      freezeBalance.add(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(
      result.toString(),
      balance.sub(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should CONSENSUS_ROLE unfreezeFrom token from account", async () => {
    // given
    const freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);

    // when
    const requestObj = await lively.unfreezeFrom.request(
      PUBLIC_SALE_WALLET,
      freezeBalance,
      1000
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(freezeBalance.toString(), "1000");
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000")
        .mul(decimal)
        .sub(new web3.utils.BN(1000))
        .toString()
    );

    // and
    let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
    assert.equal(
      result.toString(),
      freezeBalance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(
      result.toString(),
      balance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should CONSENSUS_ROLE couldnot freezeFrom token when account pause", async () => {
    // given
    const freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
    let requestObj = await lively.pause.request(PUBLIC_SALE_WALLET);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    try {
      requestObj = await lively.freezeFrom.request(
        PUBLIC_SALE_WALLET,
        freezeBalance,
        1000
      );
      await web3.eth.sendTransaction({
        from: accounts[1],
        to: relay.address,
        data: requestObj.data,
      });
    } catch (error) {}

    // then
    assert.equal(freezeBalance.toString(), "0");
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), freezeBalance.toString());

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), balance.toString());
  });

  it("Should CONSENSUS_ROLE couldnot freezeFrom token when contract pause", async () => {
    // given
    const freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
    let requestObj = await lively.pauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    try {
      requestObj = await lively.freezeFrom(
        PUBLIC_SALE_WALLET,
        freezeBalance,
        1000
      );
      await web3.eth.sendTransaction({
        from: accounts[1],
        to: relay.address,
        data: requestObj.data,
      });
    } catch (error) {}

    // then
    assert.equal(freezeBalance.toString(), "0");
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), freezeBalance.toString());

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), balance.toString());
  });

  it("Should CONSENSUS_ROLE couldnot freeze token when balance is zero ", async () => {
    // given
    const freezeBalance = await lively.freezeOf(accounts[1]);
    const balance = await lively.balanceOf(accounts[1]);
    let requestObj = await lively.unpauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    try {
      requestObj = await lively.freeze.request(freezeBalance, 1000);
      await web3.eth.sendTransaction({
        from: accounts[1],
        to: relay.address,
        data: requestObj.data,
      });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.equal(freezeBalance.toString(), "0");
    assert.equal(balance.toString(), "0");

    // and
    let result = await lively.freezeOf(accounts[1]);
    assert.equal(result.toString(), freezeBalance.toString());

    // and
    result = await lively.balanceOf(accounts[1]);
    assert.equal(result.toString(), balance.toString());
  });

  it("Should CONSENSUS_ROLE transfer token from wallet to itself account ", async () => {
    // given
    const balance = await lively.balanceOf(relay.address);
    let requestObj = await lively.unpause.request(PUBLIC_SALE_WALLET);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    requestObj = await lively.transferFrom.request(
      PUBLIC_SALE_WALLET,
      relay.address,
      1000
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(balance.toString(), "0");

    // and
    const result = await lively.balanceOf(relay.address);
    assert.equal(
      result.toString(),
      balance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should CONSENSUS_ROLE freeze token from account", async () => {
    // given
    const freezeBalance = await lively.freezeOf(relay.address);
    const balance = await lively.balanceOf(relay.address);

    // when
    const requestObj = await lively.freeze.request(freezeBalance, 1000);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(freezeBalance.toString(), "0");
    assert.equal(balance.toString(), "1000");

    // and
    let result = await lively.freezeOf(relay.address);
    assert.equal(
      result.toString(),
      freezeBalance.add(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(relay.address);
    assert.equal(
      result.toString(),
      balance.sub(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should CONSENSUS_ROLE unfreeze token from account", async () => {
    // given
    const freezeBalance = await lively.freezeOf(relay.address);
    const balance = await lively.balanceOf(relay.address);

    // when
    const requestObj = await lively.unfreeze.request(freezeBalance, 1000);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(freezeBalance.toString(), "1000");
    assert.equal(balance.toString(), "0");

    // and
    let result = await lively.freezeOf(relay.address);
    assert.equal(
      result.toString(),
      freezeBalance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(relay.address);
    assert.equal(
      result.toString(),
      balance.add(new web3.utils.BN(1000)).toString()
    );
  });
});
