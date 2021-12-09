const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken");
const RelayContract = artifacts.require("Relay");

contract("Pausable", (accounts) => {
  let lively;
  let relay;

  before(async () => {
    lively = await LivelyToken.deployed();
    relay = await RelayContract.new(lively.address);

    // init consensus role
    await lively.firstInitializeConsensusRole(relay.address);
  });

  it("Should ADMIN_ROLE pause an account", async () => {
    // given
    const isAccountPaused = await lively.pausedOf(accounts[9]);

    // when
    await lively.pause(accounts[9], { from: accounts[0] });

    // then
    assert.isNotOk(isAccountPaused);

    // and
    const result = await lively.pausedOf(accounts[9]);
    assert.isOk(result);
  });

  it("Should ADMIN_ROLE unpause an account", async () => {
    // given
    const isAccountPaused = await lively.pausedOf(accounts[9]);

    // when
    await lively.unpause(accounts[9], { from: accounts[0] });

    // then
    assert.isOk(isAccountPaused);

    // and
    const result = await lively.pausedOf(accounts[9]);
    assert.isNotOk(result);
  });

  it("Should ADMIN_ROLE could not pause contract", async () => {
    // given
    const isContractPaused = await lively.paused();

    // when
    try {
      await lively.pauseAll({ from: accounts[0] });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isNotOk(isContractPaused);

    // and
    const result = await lively.paused();
    assert.isNotOk(result);
  });

  it("Should ADMIN_ROLE could not unpause contract", async () => {
    // given
    const isContractPaused = await lively.paused();

    // when
    try {
      await lively.unpauseAll({ from: accounts[0] });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isNotOk(isContractPaused);

    // and
    const result = await lively.paused();
    assert.isNotOk(result);
  });

  it("Should CONSENSUS_ROLE pause an account", async () => {
    // given
    const isAccountPaused = await lively.pausedOf(accounts[9]);

    // when
    const requestObj = await lively.pause.request(accounts[9]);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.isNotOk(isAccountPaused);

    // and
    const result = await lively.pausedOf(accounts[9]);
    assert.isOk(result);
  });

  it("Should CONSENSUS_ROLE unpause an account", async () => {
    // given
    const isAccountPaused = await lively.pausedOf(accounts[9]);

    // when
    const requestObj = await lively.unpause.request(accounts[9]);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.isOk(isAccountPaused);

    // and
    const result = await lively.pausedOf(accounts[9]);
    assert.isNotOk(result);
  });

  it("Should CONSENSUS_ROLE pause contract", async () => {
    // given
    const isContractPaused = await lively.paused();

    // when
    const requestObj = await lively.pauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.isNotOk(isContractPaused);

    // and
    const result = await lively.paused();
    assert.isOk(result);
  });

  it("Should CONSENSUS_ROLE unpause contract", async () => {
    // given
    const isContractPaused = await lively.paused();

    // when
    const requestObj = await lively.unpauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.isOk(isContractPaused);

    // and
    const result = await lively.paused();
    assert.isNotOk(result);
  });

  it("Should any one could not pause an account", async () => {
    // given
    const isAccountPaused = await lively.pausedOf(accounts[9]);

    // when
    try {
      await lively.pause(accounts[9], { from: accounts[5] });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isNotOk(isAccountPaused);

    // and
    const result = await lively.pausedOf(accounts[9]);
    assert.isNotOk(result);
  });

  it("Should any one could not unpause an account", async () => {
    // given
    const isAccountPaused = await lively.pausedOf(accounts[9]);

    // when
    try {
      await lively.unpause(accounts[9], { from: accounts[5] });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isNotOk(isAccountPaused);

    // and
    const result = await lively.pausedOf(accounts[9]);
    assert.isNotOk(result);
  });

  it("Should any one could not pause contract", async () => {
    // given
    const isContractPaused = await lively.paused();

    // when
    try {
      await lively.pauseAll({ from: accounts[5] });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isNotOk(isContractPaused);

    // and
    const result = await lively.paused();
    assert.isNotOk(result);
  });

  it("Should any one could not unpause contract", async () => {
    // given
    const isContractPaused = await lively.paused();

    // when
    try {
      await lively.unpauseAll({ from: accounts[5] });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isNotOk(isContractPaused);

    // and
    const result = await lively.paused();
    assert.isNotOk(result);
  });
});
