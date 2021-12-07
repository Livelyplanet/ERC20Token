const assert = require("chai").assert;
// const BN = require("web3-utils").BN;

const LivelyToken = artifacts.require("LivelyToken");

// const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE");
// const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE");
// const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE");
// const NONE_ROLE = web3.utils.keccak256("NONE_ROLE");

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1";
// const FOUNDING_TEAM_WALLET_ADDRESS =
//   "0x001b0a8A4749C70AEAD435Cf7E6dA06A7bAd1a2d";

contract("ERC20", (accounts) => {
  let lively;

  before(async () => {
    lively = await LivelyToken.deployed();

    // init consensus role
    await lively.firstInitializeConsensusRole(accounts[1]);

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
    await lively.withdrawContractBalance(accounts[3], { from: accounts[1] });

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
});
