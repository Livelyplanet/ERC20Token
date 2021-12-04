const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken")

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE")
const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE")
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE")
const NONE_ROLE = web3.utils.keccak256("NONE_ROLE")

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1"

const decimal = new web3.utils.BN('1000000000000000000')

contract('Freezable', (accounts) => {

    let lively;

    before(async() => {
        lively = await LivelyToken.deployed()

        // init consensus role
        await lively.firstInitializeConsensusRole(accounts[1]);

    });

    it('Should CONSENSUS_ROLE freezeFrom token from account', async() => {
        // given
        let freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET);

        // when 
        await lively.freezeFrom(PUBLIC_SALE_WALLET, freezeBalance, 1000, {from: accounts[1]})

        // then
        assert.equal(freezeBalance.toString(), '0')
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).toString())

        // and
        let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
        assert.equal(result.toString(), freezeBalance.add(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.sub(new web3.utils.BN(1000)).toString())
    })

    it('Should CONSENSUS_ROLE unfreezeFrom token from account', async() => {
        // given
        let freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET);

        // when 
        await lively.unfreezeFrom(PUBLIC_SALE_WALLET, freezeBalance, 1000, {from: accounts[1]})

        // then
        assert.equal(freezeBalance.toString(), '1000')
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).sub(new web3.utils.BN(1000)).toString())

        // and
        let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
        assert.equal(result.toString(), freezeBalance.sub(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.add(new web3.utils.BN(1000)).toString())
    })

    it('Should CONSENSUS_ROLE couldnot freezeFrom token when account pause', async() => {
        // given
        let freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
        await lively.pause(PUBLIC_SALE_WALLET, {from: accounts[1]});

        // when
        try {
            await lively.freezeFrom(PUBLIC_SALE_WALLET, freezeBalance, 1000, {from: accounts[1]})
        } catch(error) {}

        // then
        assert.equal(freezeBalance.toString(), '0')
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).toString())

        // and
        let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
        assert.equal(result.toString(), freezeBalance.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })

    it('Should CONSENSUS_ROLE couldnot freezeFrom token when contract pause', async() => {
        // given
        let freezeBalance = await lively.freezeOf(PUBLIC_SALE_WALLET);
        let balance = await lively.balanceOf(PUBLIC_SALE_WALLET);
        await lively.pauseAll({from: accounts[1]});

        // when
        try {
            await lively.freezeFrom(PUBLIC_SALE_WALLET, freezeBalance, 1000, {from: accounts[1]})
        } catch(error) {}

        // then
        assert.equal(freezeBalance.toString(), '0')
        assert.equal(balance.toString(), (new web3.utils.BN('500000000')).mul(decimal).toString())

        // and
        let result = await lively.freezeOf(PUBLIC_SALE_WALLET);
        assert.equal(result.toString(), freezeBalance.toString())

        // and
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), balance.toString())
    })

    it('Should CONSENSUS_ROLE couldnot freeze token when balance is zero ', async() => {
        // given
        let freezeBalance = await lively.freezeOf(accounts[1]);
        let balance = await lively.balanceOf(accounts[1]);
        await lively.unpauseAll({from: accounts[1]});

        // whenadd
        try {
            await lively.freeze(freezeBalance, 1000, {from: accounts[1]})
        } catch(error) {
            // console.trace(error)
        }

        // then
        assert.equal(freezeBalance.toString(), '0')
        assert.equal(balance.toString(), '0')

        // and
        let result = await lively.freezeOf(accounts[1]);
        assert.equal(result.toString(), freezeBalance.toString())

        // and
        result = await lively.balanceOf(accounts[1])
        assert.equal(result.toString(), balance.toString())
    })

    it('Should CONSENSUS_ROLE transfer token from wallet to itself account ', async() => {
        // given
        let balance = await lively.balanceOf(accounts[1]);
        await lively.unpause(PUBLIC_SALE_WALLET, {from: accounts[1]});

        // when
        await lively.transferFrom(PUBLIC_SALE_WALLET, accounts[1], 1000, {from: accounts[1]});

        // then
        assert.equal(balance.toString(), '0')

        // and
        let result = await lively.balanceOf(accounts[1])
        assert.equal(result.toString(), balance.add(new web3.utils.BN(1000)).toString())
    })

    it('Should CONSENSUS_ROLE freeze token from account', async() => {
        // given
        let freezeBalance = await lively.freezeOf(accounts[1]);
        let balance = await lively.balanceOf(accounts[1]);

        // when 
        await lively.freeze(freezeBalance, 1000, {from: accounts[1]})

        // then
        assert.equal(freezeBalance.toString(), '0')
        assert.equal(balance.toString(), '1000')

        // and
        let result = await lively.freezeOf(accounts[1]);
        assert.equal(result.toString(), freezeBalance.add(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(accounts[1])
        assert.equal(result.toString(), balance.sub(new web3.utils.BN(1000)).toString())
    })

    it('Should CONSENSUS_ROLE unfreeze token from account', async() => {
        // given
        let freezeBalance = await lively.freezeOf(accounts[1]);
        let balance = await lively.balanceOf(accounts[1]);

        // when 
        await lively.unfreeze(freezeBalance, 1000, {from: accounts[1]})

        // then
        assert.equal(freezeBalance.toString(), '1000')
        assert.equal(balance.toString(), '0')

        // and
        let result = await lively.freezeOf(accounts[1]);
        assert.equal(result.toString(), freezeBalance.sub(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(accounts[1])
        assert.equal(result.toString(), balance.add(new web3.utils.BN(1000)).toString())
    })
})    