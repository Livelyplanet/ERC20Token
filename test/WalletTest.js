const assert = require("chai").assert;

const LivelyToken = artifacts.require("LivelyToken")

const ADMIN_ROLE = web3.utils.keccak256("ADMIN_ROLE")
const BURNABLE_ROLE = web3.utils.keccak256("BURNABLE_ROLE")
const CONSENSUS_ROLE = web3.utils.keccak256("CONSENSUS_ROLE")
const NONE_ROLE = web3.utils.keccak256("NONE_ROLE")

const PUBLIC_SALE_WALLET = "0x7eA3cFefA2b13e493110EdEd87e2Ba72C115BEc1"
const FOUNDING_TEAM_WALLET_ADDRESS = "0x001b0a8A4749C70AEAD435Cf7E6dA06A7bAd1a2d"

contract('Wallet', (accounts) => {

    let lively;

    before(async() => {
        lively = await LivelyToken.deployed()

        // init consensus role
        await lively.firstInitializeConsensusRole(accounts[1]);

    });

    it('Should ADMIN_ROLE transfer token from permited wallet to account', async() => {
        // given
        let allowance = await lively.allowance(PUBLIC_SALE_WALLET, accounts[0]);
        let balance = await lively.balanceOf(accounts[5]);

        // when
        await lively.transferFrom(PUBLIC_SALE_WALLET, accounts[5], 1000, {from: accounts[0]});

        // then
        assert.equal(balance.toString(), '0')
        assert.equal(allowance.toString(), '500000000')

        // and 
        let result = await lively.allowance(PUBLIC_SALE_WALLET, accounts[0]);
        assert.equal(result.toString(), allowance.sub(new web3.utils.BN(1000)).toString())

        // and
        result = await lively.balanceOf(accounts[5])
        assert.equal(result.toString(), balance.add(new web3.utils.BN(1000)).toString())
    })

    it('Should ADMIN_ROLE could not transfer token from not permited wallet', async() => {
        // given
        let balance = await lively.balanceOf(accounts[5]);

        // when
        try {
            await lively.transferFrom(FOUNDING_TEAM_WALLET_ADDRESS, accounts[5], 1000, {from: accounts[0]});
        } catch(error) {
            // console.trace(error)
        }

        // then
        assert.equal(balance.toString(), '1000')

        // and
        let result = await lively.balanceOf(accounts[5])
        assert.equal(result.toString(), balance.toString())
    })

    it('Should ADMIN_ROLE approve from permited wallet to account', async() => {
        // given
        let allowance = await lively.allowance(PUBLIC_SALE_WALLET, accounts[5]);

        // when
        await lively.approveFromWallet(PUBLIC_SALE_WALLET, accounts[5], allowance, 1000, {from: accounts[0]});

        // then
        assert.equal(allowance.toString(), '0')

        // and
        let result = await lively.allowance(PUBLIC_SALE_WALLET, accounts[5])
        assert.equal(result.toString(), allowance.add(new web3.utils.BN(1000)).toString())
    })

    it('Should ADMIN_ROLE could not approve token from not permited wallet', async() => {
        // given
        let allowance = await lively.allowance(FOUNDING_TEAM_WALLET_ADDRESS, accounts[5]);

        // when
        try {
            await lively.approveFromWallet(FOUNDING_TEAM_WALLET_ADDRESS, accounts[5], 1000, {from: accounts[0]});
        } catch(error) {
            // console.trace(error)
        }

        // then
        assert.equal(allowance.toString(), '0')

        // and
        let result = await lively.allowance(FOUNDING_TEAM_WALLET_ADDRESS, accounts[5])
        assert.equal(result.toString(), allowance.toString())
    })

    it('Should Any one transferFrom from alowance wallet to account', async() => {
        // given
        let allowance = await lively.allowance(PUBLIC_SALE_WALLET, accounts[5]);
        let balance = await lively.balanceOf(accounts[6]);
        let wallet = await lively.balanceOf(PUBLIC_SALE_WALLET);

        // when
        await lively.transferFrom(PUBLIC_SALE_WALLET, accounts[6], 1000, {from: accounts[5]});

        // then
        assert.equal(allowance.toString(), '1000')

        // and
        let result = await lively.allowance(PUBLIC_SALE_WALLET, accounts[5])
        assert.equal(result.toString(), allowance.sub(new web3.utils.BN(1000)).toString())

        // and 
        result = await lively.balanceOf(PUBLIC_SALE_WALLET)
        assert.equal(result.toString(), wallet.sub(new web3.utils.BN(1000)).toString())
        
        // and 
        result = await lively.balanceOf(accounts[6])
        assert.equal(result.toString(), balance.add(new web3.utils.BN(1000)).toString())
    })

})    