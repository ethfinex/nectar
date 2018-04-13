var MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
var NEC = artifacts.require("./NEC.sol")
var NectarController = artifacts.require('./NectarController.sol')

const {getTime, mineBlock, timeJump} = require('./utils/utils.js')

let nectar
let controller
let factory

// Cold Storage
var efxVaultWallet = '0x66f3edf3865b9830911614462d5fd81a0a798808'

contract('NEC setup', function(accounts) {

  it('should be initialised with 1 billion NEC totalSupply for vault', async function () {
    factory = await MiniMeTokenFactory.new()
    nectar = await NEC.new(MiniMeTokenFactory.address, efxVaultWallet)
    controller = await NectarController.new(efxVaultWallet, nectar.address)

    supply = await nectar.totalSupply.call()
    assert.equal(supply.valueOf(), 1000000000000000000000000000, "1 billion wasn't set as the totalSupply in initialisation")
    await nectar.generateTokens(accounts[0], 100000000000000)
    balance = await nectar.balanceOf(accounts[0])
    assert.equal(balance.valueOf(), 100000000000000, "Generation did not work")
  })

  it('should change the Controller to the Controller Contract', async function () {
    await nectar.changeController(controller.address, {from: accounts[0]})
    const controllerAddress = await nectar.controller.call()
    assert.equal(controllerAddress, controller.address, 'The controller was not correctly set')
  })

  it('should have NEC address correctly logged in Controller', function () {
    return controller.tokenContract.call()
    .then(function (response) {
      assert.equal(response, nectar.address, 'Wrong address')
    })
  })

  it('should start in window 1', function () {
    return controller.currentWindow()
    .then(function (window) {
      assert.equal(window.valueOf(), 1, 'Incorrect starting window')
    })
  })

////////////////////
////// Register and whitelist
////////////////////


  it("should be possible for the owner to authorise an address to contribute maker fees", function() {
    return controller.isAuthorisedMaker(accounts[1])
    .then(function(authorised) {
      assert.equal(authorised.valueOf(), false, "Maker address already authorised")
      return controller.authoriseMaker(accounts[1])
    }).then(function(response) {
      return controller.isAuthorisedMaker(accounts[1])
    }).then(function(authorised) {
      assert.equal(authorised.valueOf(), true, "Maker address still not authorised")
    })
  })

  it("should not be possible for anyone else to toggle authorised contributors", function() {
    return controller.isAuthorisedMaker(accounts[2])
    .then(async function(authorised) {
      assert.equal(authorised.valueOf(), false, "Maker address already authorised")
      try{
        await controller.authoriseMaker(accounts[2], {from: accounts[1]})
      } catch(error){
        // assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
        let reverted
        if (error.message.search('revert')) reverted = true
        assert(reverted, true)
      }
    }).then(function(response) {
      return controller.isAuthorisedMaker(accounts[2]);
    }).then(function(authorised) {
      assert.equal(authorised.valueOf(), false, "Maker address was successfully changed by non-owner")
    })
  })

  it("should register a bunch of whitelisted token holders", function () {
    return controller.register(accounts)
    .then(function (response) {
      return controller.isOnList(accounts[3])
    }).then(function (response) {
      assert.equal(response.valueOf(), true, 'Addresses not registered')
    })
  })

////////////////////
////// Rewards and contributions
////////////////////

  it('should not give user tokens for contributions as a taker', async function () {
    const watcher = controller.LogContributions()
    await web3.eth.sendTransaction({
      from: accounts[5],
      to: controller.address,
      value: web3.toWei(1, 'ether'),
      gas: 500000
    })

      const balance0 = await nectar.balanceOf(accounts[5]);
      assert.equal(balance0.toNumber(), 0);
      const events = await watcher.get()
      assert.equal(events.length, 1)
      assert.equal(events[0].args._amount.valueOf(), web3.toWei(1, 'ether'), 'Event not emitted')
    })

  it('should have a standard initial token generation rate in window 1', async function () {
    let rate1 = await controller.getFeeToTokenConversion(web3.toWei(0.005, 'ether'))
    let rate2 = await controller.getFeeToTokenConversion(web3.toWei(0.05, 'ether'))
    let rate3 = await controller.getFeeToTokenConversion(web3.toWei(0.5, 'ether'))
    let rate4 = await controller.getFeeToTokenConversion(web3.toWei(5, 'ether'))
    let rate5 = await controller.getFeeToTokenConversion(5)

    rate1 = rate1 / web3.toWei(0.005, 'ether')
    rate2 = rate2 / web3.toWei(0.05, 'ether')
    rate3 = rate3 / web3.toWei(0.5, 'ether')
    rate4 = rate4 / web3.toWei(5, 'ether')
    rate5 = rate5 / 5

    assert.equal(rate1, 1000, 'First window rate is not equal to 1')
    assert.equal(rate2, 1000, 'First window rate is not equal to 1')
    assert.equal(rate3, 1000, 'First window rate is not equal to 1')
    assert.equal(rate4, 1000, 'First window rate is not equal to 1')
    assert.equal(rate5, 1000, 'Rounding error')
  })

  it('should get tokens for contributing as a maker', async function () {
    const watcher = controller.LogContributions()
    await controller.contributeForMakers(accounts[6], {value: web3.toWei(1, 'ether'), from: accounts[1], gas: 500000})
    balance0 = await nectar.balanceOf(accounts[6])
    assert.equal(balance0.valueOf(), 1000 * web3.toWei(1,'ether'), 'maker did not receive tokens')
    const events = await watcher.get()
    assert.equal(events.length, 1)
    assert.equal(events[0].args._maker.valueOf(), true, 'Event not emitted')
  })

  it('should have sent all contributed funds to the vault address', async function () {
    const balance = await web3.eth.getBalance('0x66f3edf3865b9830911614462d5fd81a0a798808')
    assert.isAbove(balance.toNumber(), web3.toWei(1.9, 'ether'))
  })



  it('should be able to contribute now a large amount at same rate', async function () {
    let balance0 = await nectar.balanceOf(accounts[6])
    let paid = web3.toWei(20,'ether')

    const watcher = controller.LogContributions()
    await controller.contributeForMakers(accounts[6], {value: paid, from: accounts[1], gas: 500000})
    let balance1 = await nectar.balanceOf(accounts[6])
    assert.equal(balance1.toNumber(), balance0.toNumber() + 1000 * 20000000000000000000, 'maker did not receive tokens')
    const events = await watcher.get()
    assert.equal(events.length, 1)
    assert.equal(events[0].args._maker.valueOf(), true, 'Event not emitted')
  })

////// Change clock time forward 30 days

  it('should have a slightly lower contribution rate when going into the next window', async function () {

    await timeJump(30 * 24 * 60 * 60 + 10)
    await mineBlock()

    await controller.contributeForMakers(accounts[9], {value: web3.toWei(0.5,'ether'), from: accounts[1], gas: 500000})

    let newWindow = await controller.currentWindow()
    assert.equal(newWindow.valueOf(), 2, 'Wrong window')
    let newRate = await controller.getFeeToTokenConversion(web3.toWei(1, 'ether'))
    assert.isAbove(web3.toBigNumber(1000 * web3.toWei(1, 'ether')).toNumber(), newRate, 'Rate did not decrease')
    assert.isAbove(newRate.toNumber(), 0, 'Rate rounded down to zero')
  })

////// Proxy accounting feature allows Owner to trigger accounting without contributing

  it('should be possible for the owner to create tokens by pledging eth without sending it', async function () {
    let balance0 = await nectar.balanceOf(accounts[9])
    const watcher = controller.LogContributions()

    let newTokens = await controller.getFeeToTokenConversion(web3.toWei(20, 'ether'))

    await controller.proxyAccountingCreation(accounts[9], web3.toWei(20, 'ether'), newTokens, {from: accounts[0]})

    let balance1 = await nectar.balanceOf(accounts[9])

    const sum = web3.toBigNumber(balance0).plus(web3.toBigNumber(newTokens))
    assert.equal(web3.toBigNumber(balance1).toString(10), sum.toString(10), 'maker did not receive correct tokens')
    const events = await watcher.get()
    assert.equal(events.length, 1)
    assert.equal(events[0].args._maker.valueOf(), true, 'Event not emitted')
  })

////////////////////
////// ERC20 Whitelist
////////////////////

  it('should be possible for users on the whitelist to transfer tokens', function () {
    return nectar.balanceOf(accounts[0])
    .then(function (balance) {
      return nectar.balanceOf(accounts[8])
    }).then(function (balance) {
      assert.equal(balance.valueOf(), 0, 'Had initial balance already')
      return nectar.transfer(accounts[8], 90000000000000, {from: accounts[0]})
    }).then(function (response) {
      return nectar.balanceOf(accounts[8])
    }).then(function (balance){
      assert.equal(balance.valueOf(), 90000000000000, 'Tokens not sent')
    })
  })

  it('should not be possible for other users not on the whitelist to receive tokens', async function () {
    let nonWhitelistedAccount = '0xC4A5177b984D5a324CE99bd1240e837e3aF7328D'

    initialBalance = await nectar.balanceOf(nonWhitelistedAccount)
    try {
      await nectar.transfer(nonWhitelistedAccount, 10000, {from: accounts[0]})
    } catch(error){
      // assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
      let reverted
      if (error.message.search('revert')) reverted = true
      assert(reverted, true)
    }
    updatedBalance = await nectar.balanceOf(nonWhitelistedAccount)
    assert.equal(updatedBalance.valueOf(), initialBalance.valueOf(), 'Tokens not sent')
  })

  it('whitelist can be disabled and anyone can recieve and transfer', async function () {
    let nonWhitelistedAccount = '0xC4A5177b984D5a324CE99bd1240e837e3aF7328D'

    await controller.activateWhitelist(false)
    initialBalance = await nectar.balanceOf(nonWhitelistedAccount)
    await nectar.transfer(nonWhitelistedAccount, 10000, {from: accounts[0]})
    updatedBalance = await nectar.balanceOf(nonWhitelistedAccount)
    assert.equal(updatedBalance.valueOf(), 10000, 'Tokens not sent')
    await controller.activateWhitelist(true)

    initialBalance = await nectar.balanceOf(nonWhitelistedAccount)
    try {
      await nectar.transfer(nonWhitelistedAccount, 10000, {from: accounts[0]})
    } catch(error){
      // assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
      let reverted
      if (error.message.search('revert')) reverted = true
      assert(reverted, true)
    }
    updatedBalance = await nectar.balanceOf(nonWhitelistedAccount)
    assert.equal(updatedBalance.valueOf(), initialBalance.valueOf(), 'Tokens not sent')
  })

////////////////////
////// Burning tests
////////////////////

  it('should not initially be possible for users to burn and receive eth', async function () {
    const initialBalance = await nectar.balanceOf(accounts[8])
    try {
      await nectar.burnAndRetrieve(initialBalance, {from: accounts[8]})
    } catch(error){
      // assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
      let reverted
      if (error.message.search('revert')) reverted = true
      assert(reverted, true)
    }
    const finalBalance = await nectar.balanceOf(accounts[8])
    assert.equal(initialBalance.valueOf(), finalBalance.valueOf(), 'Burn succeeded')
  })

  it('should be possible to enable burning and add funds to the controller contract', async function () {
    await controller.enableBurning(true)
    const enabled = await nectar.burningEnabled.call()
    assert.equal(enabled.valueOf(), true, 'Unsuccessful enabling burning')

    await controller.topUpBalance({from: accounts[0], value: web3.toWei(1, 'ether')})

    const controllerBalance = await web3.eth.getBalance(controller.address)
    assert.equal(controllerBalance, web3.toWei(1, 'ether'), 'Contract does not hold the expected funds')
  })

  it('should be possible for user to burn and receive eth', async function () {
    const controllerBalance0 = await web3.eth.getBalance(controller.address)
    const userBalance0 = await web3.eth.getBalance(accounts[8])

    const initialTokenBalance = await nectar.balanceOf(accounts[8])
    await nectar.burnAndRetrieve(initialTokenBalance, {from: accounts[8]})
    const finalTokenBalance = await nectar.balanceOf(accounts[8])
    assert.equal(finalTokenBalance.valueOf(), 0, 'Burn succeeded')

    // Check for burn and transfer events

    const controllerBalance1 = await web3.eth.getBalance(controller.address)
    const userBalance1 = await web3.eth.getBalance(accounts[8])
    assert.isAbove(userBalance1.toNumber(), userBalance0.toNumber(), 'Did not pay anything out')
    assert.equal(userBalance1.toNumber() + controllerBalance0.toNumber(), userBalance0.toNumber() + controllerBalance1.toNumber(), 'Lost eth')
  })

////////////////////
////// Safety and upgrades
////////////////////

  it('should be possible for owner to evacuate remaining eth', async function () {
    const controllerBalance0 = await web3.eth.getBalance(controller.address)
    const vaultBalance0 = await web3.eth.getBalance('0x66f3edf3865b9830911614462d5fd81a0a798808')
    await controller.evacuateToVault()
    const controllerBalance1 = await web3.eth.getBalance(controller.address)
    const vaultBalance1 = await web3.eth.getBalance('0x66f3edf3865b9830911614462d5fd81a0a798808')
    assert.equal(controllerBalance1.toNumber(), 0, 'Did not empty contract')
    assert.equal(vaultBalance0.toNumber() + controllerBalance0.toNumber(), vaultBalance1.toNumber(), 'Did not go to vault')
  })

  it('should be possible for the owner to update the vault address', async function () {
    await controller.setVault(accounts[4], {from: accounts[0]})

    const newVault = await controller.vaultAddress.call()
    assert.equal(newVault.valueOf(), accounts[4], 'Did not correctly change')
  })

  it('should not be possible for anyone else to update the vault address', async function () {
    try {
      await controller.setVault(accounts[5], {from: accounts[1]})
    } catch(error){
      // assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
      let reverted
      if (error.message.search('revert')) reverted = true
      assert(reverted, true)
    }
    const vault = await controller.vaultAddress.call()
    assert.equal(vault.valueOf(), accounts[4], 'It has changed again')
  })

  it('should be possible for the owner to upgrade the controller', async function () {
    await controller.upgradeController(accounts[9], {from: accounts[0]})
    const newController =  await nectar.controller.call()
    assert.equal(newController.valueOf(), accounts[9], 'Not successful')
  })

})
