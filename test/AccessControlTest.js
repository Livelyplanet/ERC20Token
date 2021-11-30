const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');


const LivelyToken = artifacts.require("LivelyToken")

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE")
const BURNABLE_ROLE = web3.utils.keccak256("BURNALBE_ROLE")
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE")



contract('LivelyToken', (accounts) => {

    let lively;

    beforeEach(async() => {
        lively = await LivelyToken.deployed()
    });

    it('Should ADMIN_ROLE role initailized after deploy', async() => {

        // when
        const result = await lively.hasRole(ADMIN_ROLE, accounts[0])
        
        // then
        assert.equal(result, true, 'ACL init ADMIN_ROLE role failed')
    })

    it('Should ADMIN_ROLE can setup CONSENSUS_ROLE', async() => {
        // given
        const isConsensusRoleExist = await lively.hasRole(CONSENSUS_ROLE, accounts[1])

        // when
        await truffleAssert.reverts(lively.firstInitializeConsensusRole(accounts[1]), "Hello");

        // // then 
        // assert.isNotOk(isConsensusRoleExist, 'Consensus Role must not has an account before first init')

        // // and
        // const result = await lively.hasRole(CONSENSUS_ROLE, accounts[1])
        // assert.isOk(result, 'Consensus Role must has an account after first init')

    })
})