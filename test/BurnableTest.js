const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken")

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE")
const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE")
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE")
const NONE_ROLE = web3.utils.keccak256("NONE_ROLE")

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1"
const decimal = new web3.utils.BN('1000000000000000000')

contract('Burnable', (accounts) => {

    let lively;

    before(async() => {
        lively = await LivelyToken.deployed()

        // init consensus role
        await lively.firstInitializeConsensusRole(accounts[1]);

        // init burnable role
        await lively.grantRole(BURNABLE_ROLE, accounts[2], accounts[2], {from: accounts[1]})

    });

    it('Should CONSENSUS_ROLE burn token when contract pause', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)
        await lively.pauseAll({from: accounts[1]})

        // when
        await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[1]})

        //then
        assert.equal(totalSupply.toString(), (new web3.utils.BN('1000000000')).mul(decimal).toString())
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).toString())

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.sub(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.sub(new web3.utils.BN(1000)).toString())
    })

    it('Should CONSENSUS_ROLE could not burn token when contract not pause', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)
        await lively.unpauseAll({from: accounts[1]})

        // when
        try {
            await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[1]})
        } catch(error) {}

        //then
        assert.equal(totalSupply.toString(), (new web3.utils.BN('1000000000')).mul(decimal).sub(new web3.utils.BN(1000)).toString())
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).sub(new web3.utils.BN(1000)).toString())

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })
    

    it('Should BRUNABLE_ROLE burn token when contract pause', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)
        await lively.pauseAll({from: accounts[1]})

        // when
        await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[2]})

        //then
        assert.equal(totalSupply.toString(), (new web3.utils.BN('1000000000')).mul(decimal).sub(new web3.utils.BN(1000)).toString())
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).sub(new web3.utils.BN(1000)).toString())

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.sub(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.sub(new web3.utils.BN(1000)).toString())
    })

    it('Should BURANBLE_ROLE could not burn token when contract not pause', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)
        await lively.unpauseAll({from: accounts[1]})

        // when
        try {
            await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[2]})
        } catch(error) {}

        //then
        assert.equal(totalSupply.toString(), (new web3.utils.BN('1000000000')).mul(decimal).sub(new web3.utils.BN(2000)).toString())
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).sub(new web3.utils.BN(2000)).toString())

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })

    it('Should ADMIN_ROLE could not burn token', async() => {
        // given
        let totalSupply = await lively.totalSupply()
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET)

        // when
        try {
            await lively.burn(PUBLIC_SALE_WALLET, balance, totalSupply, 1000, {from: accounts[0]})
        } catch(error) {}

        //then
        assert.equal(totalSupply.toString(), (new web3.utils.BN('1000000000')).mul(decimal).sub(new web3.utils.BN(2000)).toString())
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).sub(new web3.utils.BN(2000)).toString())

        // and
        let result = await lively.totalSupply()
        assert.equal(result.toString(), totalSupply.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })
})