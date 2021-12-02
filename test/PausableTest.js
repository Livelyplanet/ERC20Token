const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken")

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE")
const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE")
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE")
const NONE_ROLE = web3.utils.keccak256("NONE_ROLE")

contract('Pausable', (accounts) => {

    let lively;

    before(async() => {
        lively = await LivelyToken.deployed()

        // init consensus role
        await lively.firstInitializeConsensusRole(accounts[1]);
    });

    it('Should ADMIN_ROLE pause an account', async() => {

        // given
        const isAccountPaused = await lively.pausedOf(accounts[9])
        
        // when 
        await lively.pause(accounts[9], {from: accounts[0]})

        // then
        assert.isNotOk(isAccountPaused);

        // and
        let result = await lively.pausedOf(accounts[9])
        assert.isOk(result)
    })

    it('Should ADMIN_ROLE unpause an account', async() => {

        // given
        const isAccountPaused = await lively.pausedOf(accounts[9])
        
        // when 
        await lively.unpause(accounts[9], {from: accounts[0]})

        // then
        assert.isOk(isAccountPaused);

        // and
        let result = await lively.pausedOf(accounts[9])
        assert.isNotOk(result)
    })

    it('Should ADMIN_ROLE could not pause contract', async() => {

        // given
        const isContractPaused = await lively.paused()
        
        // when
        try { 
            await lively.pauseAll({from: accounts[0]})
        } catch(error) {
            // console.trace(error)
        }
        
        // then
        assert.isNotOk(isContractPaused);

        // and
        let result = await lively.paused()
        assert.isNotOk(result)
    })

    it('Should ADMIN_ROLE could not unpause contract', async() => {

        // given
        const isContractPaused = await lively.paused()
        
        // when
        try { 
          await lively.unpauseAll({from: accounts[0]})
        } catch(error) {
            // console.trace(error)
        }

        // then
        assert.isNotOk(isContractPaused);

        // and
        let result = await lively.paused()
        assert.isNotOk(result)
    })

    it('Should CONSENSUS_ROLE pause an account', async() => {

        // given
        const isAccountPaused = await lively.pausedOf(accounts[9])
        
        // when 
        await lively.pause(accounts[9], {from: accounts[1]})

        // then
        assert.isNotOk(isAccountPaused);

        // and
        let result = await lively.pausedOf(accounts[9])
        assert.isOk(result)
    })

    it('Should CONSENSUS_ROLE unpause an account', async() => {

        // given
        const isAccountPaused = await lively.pausedOf(accounts[9])
        
        // when 
        await lively.unpause(accounts[9], {from: accounts[1]})

        // then
        assert.isOk(isAccountPaused);

        // and
        let result = await lively.pausedOf(accounts[9])
        assert.isNotOk(result)
    })

    it('Should CONSENSUS_ROLE pause contract', async() => {

        // given
        const isContractPaused = await lively.paused()
        
        // when
        await lively.pauseAll({from: accounts[1]})
        
        // then
        assert.isNotOk(isContractPaused);

        // and
        let result = await lively.paused()
        assert.isOk(result)
    })

    it('Should CONSENSUS_ROLE unpause contract', async() => {

        // given
        const isContractPaused = await lively.paused()
        
        // when
        await lively.unpauseAll({from: accounts[1]})

        // then
        assert.isOk(isContractPaused);

        // and
        let result = await lively.paused()
        assert.isNotOk(result)
    })

    it('Should any one could not pause an account', async() => {

        // given
        const isAccountPaused = await lively.pausedOf(accounts[9])
        
        // when
        try { 
            await lively.pause(accounts[9], {from: accounts[5]})
        } catch(error) {
            //console.trace(error)
        }

        // then
        assert.isNotOk(isAccountPaused);

        // and
        let result = await lively.pausedOf(accounts[9])
        assert.isNotOk(result)
    })

    it('Should any one could not unpause an account', async() => {

        // given
        const isAccountPaused = await lively.pausedOf(accounts[9])
        
        // when 
        try {
            await lively.unpause(accounts[9], {from: accounts[5]})
        } catch (error) {
            //console.trace(error)
        }

        // then
        assert.isNotOk(isAccountPaused);

        // and
        let result = await lively.pausedOf(accounts[9])
        assert.isNotOk(result)
    })

    it('Should any one could not pause contract', async() => {

        // given
        const isContractPaused = await lively.paused()
        
        // when
        try {
            await lively.pauseAll({from: accounts[5]})
        } catch (error) {
            //console.trace(error)
        }
        
        // then
        assert.isNotOk(isContractPaused);

        // and
        let result = await lively.paused()
        assert.isNotOk(result)
    })

    it('Should any one could not unpause contract', async() => {

        // given
        const isContractPaused = await lively.paused()
        
        // when
        try {
            await lively.unpauseAll({from: accounts[5]})
        } catch (error) {
            //console.trace(error)
        }

        // then
        assert.isNotOk(isContractPaused);

        // and
        let result = await lively.paused()
        assert.isNotOk(result)
    })
})