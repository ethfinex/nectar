var NEC = artifacts.require("./NEC.sol");
var NectarController = artifacts.require('./NectarController.sol')

var nectar
var controller

contract('NEC setup', function(accounts) {

  it('should be initialised with 100000 NEC totalSupply for vault', function () {
    return NEC.deployed().then(function (instance) {
      nectar = instance
      return instance.totalSupply.call()
    }).then(function (supply) {
      assert.equal(supply.valueOf(), 100000000000000000000000, "100000 wasn't set as the totalSupply in initialisation")
    })
  })

  it('should change the Controller to the Controller Contract', function () {
    return NectarController.deployed().then(function (instance) {
      controller = instance
      return nectar.changeController(controller.address, {from: accounts[0]})
    }).then(function () {
      return nectar.controller.call()
    }).then(function (result) {
      assert.equal(result, controller.address, 'The controller was not correctly set')
    })
  })

  it('should have NEC address correctly logged in Controller', function () {
    return controller.tokenContract.call()
    .then(function (response) {
      assert.equal(response, nectar.address)
    })
  })

})

contract('Nectar controller', function (accounts) {
  it('should start in window 1', function () {
    return controller.currentWindow()
    .then(function (window) {
      assert.equal(window.valueOf(), 1, 'Incorrect starting window')
    })
  })

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
        await controller.authoriseMaker(accounts[2], {from: accounts[1]});
      } catch(e){
        assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
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
})

contract('Contributions', function (accounts) {

  it('should not give user tokens for contributions as a taker', async function () {
    const watcher = controller.LogContributions()
    web3.eth.sendTransaction({
      from: accounts[0],
      to: controller.address,
      value: web3.toWei(1, 'ether'),
      gas: 500000
    })

      const balance0 = await token.balanceOf(accounts[5]);
      assert.equal(balance0.toNumber(), 1200);
      assert.equal(true, false, 'oops')
      const events = await watcher.get()
      assert.equal(events.length, 1)
      assert.equal(events[0].args._amount.valueOf(), web3.toWei(1, 'ether'), 'Event not emitted')
    })

  it('should have a standard initial token generation rate in window 1', function () {
    let balance1
    let balance2
    let balance3
    let balance4
    let balance5

    return controller.contributeForMakers(accounts[6], {value: web3.toWei(0.5, 'ether'), from: accounts[0]})
    .then(function (response) {
      return nectar.balanceOf(accounts[6])
    }).then(function (response) {
      balance1 = response.valueOf()
      assert.equal(balance1, 0, 'Got tokens')
    })
  })

  it('should give user tokens at standard rate for contributing as a maker', function () {
    const watcher = controller.LogContributions()
    return controller.contributeForMakers(accounts[6], {value: web3.toWei(1, 'ether'), from: accounts[5]})
    .then(function (response) {
      return nectar.balanceOf(accounts[5])
    }).then(function (response) {
      assert.equal(response.valueOf(), 0, 'maker did not receive tokens')
      assert.equal(true, false, 'oops')
      return watcher.get()
    }).then(function(events){
      assert.equal(events.length, 1)
      assert.equal(events[0].args._amount.valueOf(), web3.toWei(1, 'ether'), 'Event not emitted')
      assert.equal(events[0].args._maker.valueOf(), true, 'Event not emitted')
    })
  })

  it('should send all contributed funds to the vault address', function () {

  })

  // change clock time forward 7 days

  it('should have a lower contribution rate in the next window', function () {

  })

})

contract('ERC20 methods', function (accounts) {

  it('should be possible for users on the whitelist to transfer tokens', function () {

  })

  it('should not be possible for other users not on the whitelist to receive tokens', function () {

  })

})

contract('Burning for rewards', function (accounts) {

  it('should not initially be possible for users to burn and receive eth', function () {

  })

  it('should be possible to enable burning and add funds to the contract', function () {

  })

  it('should be possible for user to burn and receive eth', function () {

  })

  it('should be possible for owner to evacuate remaining eth', function () {

  })

})

contract('Upgrades', function (accounts) {

  it('should be possible for the owner to update the vault address', function () {

  })

  it('should not be possible for anyone else to update the vault address', function () {

  })

  it('should be possible for the owner to upgrade the controller', function () {

  })

})
