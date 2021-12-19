/* eslint-disable no-unused-expressions */
const { assert, expect } = require("chai");

const RelayContract = artifacts.require("Relay");
const LivelyToken = artifacts.require("LivelyToken");

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1";

const iAccessControlId = "0xba7df352";
const iBurnableId = "0xde7bf0a2";
const iMintableId = "0xa647e8ec";
const iFreezableId = "0x991ebb18";
const iERC20Id = "0x942e8b22";
const iERC20SecId = "0xb85502e8";
const iPausable = "0xe613f82a";

contract("ERC20", (accounts) => {
  let lively;
  let relay;

  before(async () => {
    lively = await LivelyToken.deployed();
    relay = await RelayContract.new(lively.address);

    // init consensus role
    await lively.firstInitializeConsensusRole(relay.address);

    // init accounts 5
    await lively.transferFrom(PUBLIC_SALE_WALLET, accounts[5], 10000, {
      from: accounts[0],
    });
  });

  it("Should Any One transfer token from itself account", async () => {
    // given
    const fromBalance = await lively.balanceOf(accounts[5]);
    const toBalance = await lively.balanceOf(accounts[6]);

    // when
    await lively.transfer(accounts[6], 1000, { from: accounts[5] });

    // then
    assert.equal(fromBalance.toString(), "10000");
    assert.equal(toBalance.toString(), "0");

    // and
    let result = await lively.balanceOf(accounts[5]);
    assert.equal(
      result.toString(),
      fromBalance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[6]);
    assert.equal(
      result.toString(),
      toBalance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Any One approve token to other account", async () => {
    // given
    const allowance = await lively.allowance(accounts[5], accounts[6]);

    // when
    await lively.approve(accounts[6], 1000, { from: accounts[5] });

    // then
    assert.equal(allowance.toString(), "0");

    // and
    const result = await lively.allowance(accounts[5], accounts[6]);
    assert.equal(
      result.toString(),
      allowance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Any One approveSec token to other account", async () => {
    // given
    const allowance = await lively.allowance(accounts[5], accounts[6]);

    // when
    await lively.approveSec(accounts[6], allowance, 2000, {
      from: accounts[5],
    });

    // then
    assert.equal(allowance.toString(), "1000");

    // and
    const result = await lively.allowance(accounts[5], accounts[6]);
    assert.equal(
      result.toString(),
      allowance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Any One increase allowance token to other account", async () => {
    // given
    const allowance = await lively.allowance(accounts[5], accounts[6]);

    // when
    await lively.increaseAllowanceSec(accounts[6], allowance, 1000, {
      from: accounts[5],
    });

    // then
    assert.equal(allowance.toString(), "2000");

    // and
    const result = await lively.allowance(accounts[5], accounts[6]);
    assert.equal(
      result.toString(),
      allowance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Any One decrease allowance token to other account", async () => {
    // given
    const allowance = await lively.allowance(accounts[5], accounts[6]);

    // when
    await lively.decreaseAllowanceSec(accounts[6], allowance, 1000, {
      from: accounts[5],
    });

    // then
    assert.equal(allowance.toString(), "3000");

    // and
    const result = await lively.allowance(accounts[5], accounts[6]);
    assert.equal(
      result.toString(),
      allowance.sub(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Any one transferFromSec from alowance wallet to other account", async () => {
    // given
    const allowance = await lively.allowance(accounts[5], accounts[6]);
    const fromBalance = await lively.balanceOf(accounts[5]);
    const toBalance = await lively.balanceOf(accounts[7]);

    // when
    await lively.transferFromSec(accounts[5], accounts[7], fromBalance, 1000, {
      from: accounts[6],
    });

    // then
    assert.equal(allowance.toString(), "2000");

    // and
    let result = await lively.allowance(accounts[5], accounts[6]);
    assert.equal(
      result.toString(),
      allowance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[5]);
    assert.equal(
      result.toString(),
      fromBalance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[7]);
    assert.equal(
      result.toString(),
      toBalance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Any one transferFrom from alowance wallet to other account", async () => {
    // given
    const allowance = await lively.allowance(accounts[5], accounts[6]);
    const fromBalance = await lively.balanceOf(accounts[5]);
    const toBalance = await lively.balanceOf(accounts[7]);

    // when
    await lively.transferFrom(accounts[5], accounts[7], 1000, {
      from: accounts[6],
    });

    // then
    assert.equal(allowance.toString(), "1000");

    // and
    let result = await lively.allowance(accounts[5], accounts[6]);
    assert.equal(
      result.toString(),
      allowance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[5]);
    assert.equal(
      result.toString(),
      fromBalance.sub(new web3.utils.BN(1000)).toString()
    );

    // and
    result = await lively.balanceOf(accounts[7]);
    assert.equal(
      result.toString(),
      toBalance.add(new web3.utils.BN(1000)).toString()
    );
  });

  it("Should Contract receive ether", async () => {
    // given
    const contractBalance = await web3.eth.getBalance(lively.address);

    // when
    await web3.eth.sendTransaction({
      from: accounts[3],
      to: lively.address,
      value: web3.utils.toWei("10", "ether"),
    });

    // then
    assert.equal(contractBalance.toString(), "0");

    // and
    const result = await web3.eth.getBalance(lively.address);
    assert.equal(result.toString(), web3.utils.toWei("10", "ether"));
  });

  it("Should CONSENSUS withdraw all balance from contract", async () => {
    // given
    const balance = await web3.eth.getBalance(lively.address);
    const accountBalance = await web3.eth.getBalance(accounts[3]);

    // when
    const requestObj = await lively.withdrawalBalance.request(accounts[3]);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    let result = await web3.eth.getBalance(lively.address);
    assert.equal(result.toString(), "0");

    // and
    result = await web3.eth.getBalance(accounts[3]);
    assert.equal(
      result.toString(),
      new web3.utils.BN(accountBalance.toString()).add(
        new web3.utils.BN(balance)
      )
    );
  });

  it("Should support IAccessControl, IBurnable, IERC20, IERC20SEC, IFreezable, IMintable, IPauseable", async () => {
    expect(await lively.supportsInterface(iAccessControlId)).to.be.true;
    expect(await lively.supportsInterface(iBurnableId)).to.be.true;
    expect(await lively.supportsInterface(iMintableId)).to.be.true;
    expect(await lively.supportsInterface(iFreezableId)).to.be.true;
    expect(await lively.supportsInterface(iERC20Id)).to.be.true;
    expect(await lively.supportsInterface(iERC20SecId)).to.be.true;
    expect(await lively.supportsInterface(iPausable)).to.be.true;
  });
});
