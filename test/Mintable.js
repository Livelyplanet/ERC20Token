const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken")

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE")
const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE")
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE")
const NONE_ROLE = web3.utils.keccak256("NONE_ROLE")

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1"

contract('Mintable', (accounts) => {

    let lively;

    before(async() => {
        lively = await LivelyToken.deployed()

        // init consensus role
        await lively.firstInitializeConsensusRole(accounts[1]);
    });

    it('Should CONSENSUS_ROLE mint token when contract pause', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)
        await lively.pauseAll({from: accounts[1]})

        // when
        await lively.mint(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[1]})

        //then
        assert.equal(totalSupply.toString(), '1000000000')
        assert.equal(balance.toString(), '500000000')

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.add(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.add(new web3.utils.BN(1000)).toString())
    })
    
    it('Should CONSENSUS_ROLE could not mint token when contract not pause', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)
        await lively.unpauseAll({from: accounts[1]})

        // when
        try {
            await lively.mint(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[1]})
        } catch(error) {}

        //then
        assert.equal(totalSupply.toString(), '1000001000')
        assert.equal(balance.toString(), '500001000')

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })
    
    it('Should ADMIN_ROLE could not mint token', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)

        // when
        try {
            await lively.mint(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[0]})
        } catch(error) {}

        //then
        assert.equal(totalSupply.toString(), '1000001000')
        assert.equal(balance.toString(), '500001000')

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })
})