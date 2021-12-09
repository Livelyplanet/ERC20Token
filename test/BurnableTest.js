const assert = require("chai").assert;

const RelayContract = artifacts.require("Relay");
const LivelyToken = artifacts.require("LivelyToken");

const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE");

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1";
const decimal = new web3.utils.BN("1000000000000000000");

contract("Burnable", (accounts) => {
  let lively;
  let relay;

  before(async () => {
    lively = await LivelyToken.deployed();
    relay = await RelayContract.new(lively.address);

    // init consensus role
    await lively.firstInitializeConsensusRole(relay.address);

    // init burnable role
    const requestObj = await lively.grantRole.request(
      BURNABLE_ROLE,
      accounts[2],
      accounts[2]
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });
  });

  it("Should CONSENSUS_ROLE burn token when contract pause", async () => {
    // given
    const totalSupply = await lively.totalSupply();
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
    let requestObj = await lively.pauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    requestObj = await lively.burn.request(
      PUBLIC_SALE_WALLET,
      balance,
      totalSupply,
      1000
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.equal(
      totalSupply.toString(),
      new web3.utils.BN("1000000000").mul(decimal).toString()
    );
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000").mul(decimal).toString()
    );

    // and
    let result = await lively.totalSupply();
    assert.equal(
      result.toString(),
      totalSupply.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(
      result.toString(),
      balance.sub(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should CONSENSUS_ROLE could not burn token when contract not pause", async () => {
    // given
    const totalSupply = await lively.totalSupply();
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
    let requestObj = await lively.unpauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    try {
      requestObj = await lively.burn.request(
        PUBLIC_SALE_WALLET,
        balance,
        totalSupply,
        1000
      );
      await web3.eth.sendTransaction({
        from: accounts[1],
        to: relay.address,
        data: requestObj.data,
      });
    } catch (error) {}

    // then
    assert.equal(
      totalSupply.toString(),
      new web3.utils.BN("1000000000")
        .mul(decimal)
        .sub(new web3.utils.BN(1000))
        .toString()
    );
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000")
        .mul(decimal)
        .sub(new web3.utils.BN(1000))
        .toString()
    );

    // and
    let result = await lively.totalSupply();
    assert.equal(result.toString(), totalSupply.toString());

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), balance.toString());
  });

  it("Should BRUNABLE_ROLE burn token when contract pause", async () => {
    // given
    const totalSupply = await lively.totalSupply();
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
    const requestObj = await lively.pauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {
      from: accounts[2],
    });

    // then
    assert.equal(
      totalSupply.toString(),
      new web3.utils.BN("1000000000")
        .mul(decimal)
        .sub(new web3.utils.BN(1000))
        .toString()
    );
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000")
        .mul(decimal)
        .sub(new web3.utils.BN(1000))
        .toString()
    );

    // and
    let result = await lively.totalSupply();
    assert.equal(
      result.toString(),
      totalSupply.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(
      result.toString(),
      balance.sub(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should BURANBLE_ROLE could not burn token when contract not pause", async () => {
    // given
    const totalSupply = await lively.totalSupply();
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
    const requestObj = await lively.unpauseAll.request();
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // when
    try {
      await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {
        from: accounts[2],
      });
    } catch (error) {}

    // then
    assert.equal(
      totalSupply.toString(),
      new web3.utils.BN("1000000000")
        .mul(decimal)
        .sub(new web3.utils.BN(2000))
        .toString()
    );
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000")
        .mul(decimal)
        .sub(new web3.utils.BN(2000))
        .toString()
    );

    // and
    let result = await lively.totalSupply();
    assert.equal(result.toString(), totalSupply.toString());

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), balance.toString());
  });

  it("Should ADMIN_ROLE could not burn token", async () => {
    // given
    const totalSupply = await lively.totalSupply();
    const balance = await lively.balanceOf(PUBLIC_SALE_WALLET);

    // when
    try {
      await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {
        from: accounts[0],
      });
    } catch (error) {}

    // then
    assert.equal(
      totalSupply.toString(),
      new web3.utils.BN("1000000000")
        .mul(decimal)
        .sub(new web3.utils.BN(2000))
        .toString()
    );
    assert.equal(
      balance.toString(),
      new web3.utils.BN("500000000")
        .mul(decimal)
        .sub(new web3.utils.BN(2000))
        .toString()
    );

    // and
    let result = await lively.totalSupply();
    assert.equal(result.toString(), totalSupply.toString());

    // and
    result = await lively.balanceOf(PUBLIC_SALE_WALLET);
    assert.equal(result.toString(), balance.toString());
  });
});
