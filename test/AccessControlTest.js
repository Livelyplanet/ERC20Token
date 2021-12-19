const assert = require("chai").assert;

const RelayContract = artifacts.require("Relay");
const LivelyToken = artifacts.require("LivelyToken");

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE");
const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE");
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE");

contract("AccessControl", (accounts) => {
  let lively;
  let relay;
  let relay2;

  before(async () => {
    lively = await LivelyToken.deployed();
    relay = await RelayContract.new(lively.address);
    relay2 = await RelayContract.new(lively.address);
  });

  it("Should ADMIN_ROLE role initailized after deploy", async () => {
    // when
    const result = await lively.hasRole(ADMIN_ROLE, accounts[0]);

    // then
    assert.equal(result, true, "ACL init ADMIN_ROLE role failed");
  });

  it("Should ADMIN_ROLE cannot setup CONSENSUS_ROLE with EOA", async () => {
    // given
    const isConsensusRoleExist = await lively.hasRole(
      CONSENSUS_ROLE,
      accounts[1]
    );

    // when
    try {
      await lively.firstInitializeConsensusRole(accounts[1]);
    } catch (error) {
      // console.trace("tx error")
    }

    // then
    assert.isNotOk(
      isConsensusRoleExist,
      "Consensus Role must not has an account before first init"
    );

    // and
    const result = await lively.hasRole(CONSENSUS_ROLE, accounts[1]);
    assert.isNotOk(
      result,
      "Consensus Role should has not an account after first init in TEST env"
    );
  });

  it("Should ADMIN_ROLE can setup CONSENSUS_ROLE with contract", async () => {
    // given
    const isConsensusRoleExist = await lively.hasRole(
      CONSENSUS_ROLE,
      relay.address
    );

    // when
    await lively.firstInitializeConsensusRole(relay.address);

    // then
    assert.isNotOk(
      isConsensusRoleExist,
      "Consensus Role must not has an account before first init"
    );

    // and
    const result = await lively.hasRole(CONSENSUS_ROLE, relay.address);
    assert.isOk(
      result,
      "Consensus Role must has an account after first init in TEST env"
    );
  });

  it("Should BURNABLE_ROLE has an acount after grant role", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    const txData = web3.eth.abi.encodeFunctionCall(
      {
        name: "grantRole",
        type: "function",
        inputs: [
          {
            type: "bytes32",
            name: "role",
          },
          {
            type: "address",
            name: "currentAccount",
          },
          {
            type: "address",
            name: "newAccount",
          },
        ],
      },
      [BURNABLE_ROLE, accounts[2], accounts[2]]
    );

    await relay.sendTransaction({ from: accounts[1], data: txData });
    // await lively.grantRole(BURNABLE_ROLE, accounts[2], accounts[2], {
    //   from: accounts[1],
    // });

    // then
    assert.isNotOk(
      isBurnableRoleExist,
      "Burnable role before grant role has a an account"
    );

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[2]);
    assert.isOk(result, "Burnable role must has an account after grant role");
  });

  it("Should any one could not call grantRole", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    try {
      await lively.grantRole(BURNABLE_ROLE, accounts[2], accounts[3], {
        from: accounts[10],
      });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isBurnableRoleExist);

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[3]);
    assert.isNotOk(result);
  });

  it("Should any one could not call revokeRole", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    try {
      await lively.revokeRole(BURNABLE_ROLE, accounts[2], {
        from: accounts[10],
      });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isBurnableRoleExist);

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[3]);
    assert.isNotOk(result);
  });

  it("Should BURNABLE_ROLE could not call grantRole", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    try {
      await lively.grantRole(BURNABLE_ROLE, accounts[2], accounts[3], {
        from: accounts[2],
      });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isBurnableRoleExist);

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[3]);
    assert.isNotOk(result);
  });

  it("Should BURNABLE_ROLE could not call revokeRole", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    try {
      await lively.revokeRole(BURNABLE_ROLE, accounts[2], {
        from: accounts[2],
      });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isBurnableRoleExist);

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[3]);
    assert.isNotOk(result);
  });

  it("Should ADMIN_ROLE could not call grantRole", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    try {
      await lively.grantRole(BURNABLE_ROLE, accounts[2], accounts[3]);
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isBurnableRoleExist);

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[3]);
    assert.isNotOk(result);
  });

  it("Should ADMIN_ROLE could not call revokeRole", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    try {
      await lively.revokeRole(BURNABLE_ROLE, accounts[2]);
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isBurnableRoleExist);

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[2]);
    assert.isOk(result);
  });

  it("Should BURNABLE_ROLE has not an acount after revoke role", async () => {
    // given
    const isBurnableRoleExist = await lively.hasRole(
      BURNABLE_ROLE,
      accounts[2]
    );

    // when
    const requestObj = await lively.revokeRole.request(
      BURNABLE_ROLE,
      accounts[2]
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.isOk(isBurnableRoleExist, "Burnable role must has an account");

    // and
    const result = await lively.hasRole(BURNABLE_ROLE, accounts[2]);
    assert.isNotOk(
      result,
      "Burnable role must has not an account after revoke role"
    );
  });

  it("Should CONSENSUS_ROLE could not revoke role from itself", async () => {
    // given
    const isConsensusRoleExist = await lively.hasRole(
      CONSENSUS_ROLE,
      relay.address
    );

    // when
    try {
      const requestObj = await lively.revokeRole.request(
        CONSENSUS_ROLE,
        relay.address
      );
      await web3.eth.sendTransaction({
        from: accounts[1],
        to: relay.address,
        data: requestObj.data,
      });
    } catch (error) {
      // console.trace(error)
    }

    // then
    assert.isOk(isConsensusRoleExist, "Consensus role must has an account");
  });

  it("Should CONSENSUS_ROLE can grantRole to newAccount", async () => {
    // given
    const isConsensusRoleExist = await lively.hasRole(
      CONSENSUS_ROLE,
      relay.address
    );

    // when
    const requestObj = await lively.grantRole.request(
      CONSENSUS_ROLE,
      relay.address,
      relay2.address
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay.address,
      data: requestObj.data,
    });

    // then
    assert.isOk(isConsensusRoleExist, "Consensus role must has an account");

    // and
    const result = await lively.hasRole(CONSENSUS_ROLE, relay2.address);
    assert.isOk(result, "Consensus role granted to relay2.address");
  });

  it("Should CONSENSUS_ROLE can grant ADMIN_ROLE to newAccount", async () => {
    // given
    const isAdminRoleExist = await lively.hasRole(ADMIN_ROLE, accounts[0]);

    // when
    const requestObj = await lively.grantRole.request(
      ADMIN_ROLE,
      accounts[0],
      accounts[5]
    );
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay2.address,
      data: requestObj.data,
    });

    // then
    assert.isOk(isAdminRoleExist, "Admin role must has an account");

    // and
    const result = await lively.hasRole(ADMIN_ROLE, accounts[5]);
    assert.isOk(result, "Admin role granted to accounts[5]");
  });

  it("Should CONSENSUS_ROLE can revoke ADMIN_ROLE from account", async () => {
    // given
    const isAdminRoleExist = await lively.hasRole(ADMIN_ROLE, accounts[5]);

    // when
    const requestObj = await lively.revokeRole.request(ADMIN_ROLE, accounts[5]);
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: relay2.address,
      data: requestObj.data,
    });

    // then
    assert.isOk(isAdminRoleExist, "Admin role must has an account");

    // and
    const result = await lively.hasRole(ADMIN_ROLE, accounts[5]);
    assert.isNotOk(result, "Admin role revoke from accounts[5]");
  });
});
