var NEC = artifacts.require("./NEC.sol");
var NectarController = artifacts.require('./NectarController.sol')

contract('NEC setup', function(accounts) {

  it("should be initialised with 100000 NEC totalSupply for vault", function() {
    return NEC.deployed().then(function(instance) {
      return instance.totalSupply.call();
    }).then(function(supply) {
      assert.equal(supply.valueOf(), 100000000000000000000000, "100000 wasn't set as the totalSupply in initialisation");
    });
  });

  it("should change the Controller to the Controller Contract", function() {
    return NEC.deployed().then(function(instance) {
      nec = instance
      return NectarController.deployed()
    }).then(function(instance) {
      control = instance
      return nec.changeController(control.address, {from: accounts[0]});
    }).then(function() {
      return nec.controller.call()
    }).then(function(result) {
      assert.equal(result, control.address, "The controller was not correctly set");
    });
  });

});

contract('Nectar controller', function(accounts) {

  it("should start in window 1", function() {
    return NectarController.deployed().then(function(instance) {
      return instance.currentWindow();
    }).then(function(window) {
      assert.equal(window.valueOf(), 1, "Incorrect starting window");
    });
  });

  it("should be possible for the owner to authorise an address to contribute maker fees", function() {
    return NectarController.deployed().then(function(instance) {
      liq = instance;
      return liq.isAuthorisedMaker(accounts[1]);
    }).then(function(authorised) {
      assert.equal(authorised.valueOf(), false, "Maker address already authorised");
      return liq.authoriseMaker(accounts[1]);
    }).then(function(response) {
      return liq.isAuthorisedMaker(accounts[1]);
    }).then(function(authorised) {
      assert.equal(authorised.valueOf(), true, "Maker address still not authorised");
    });
  });

  it("should not be possible for anyone else to toggle authorised contributors", function() {
    return NectarController.deployed().then(function(instance) {
      liq = instance;
      return liq.isAuthorisedMaker(accounts[2]);
    }).then(async function(authorised) {
      assert.equal(authorised.valueOf(), false, "Maker address already authorised");
      try{
        await liq.authoriseMaker(accounts[2], {from: accounts[1]});
      } catch(e){
        assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
      }
    }).then(function(response) {
      return liq.isAuthorisedMaker(accounts[2]);
    }).then(function(authorised) {
      assert.equal(authorised.valueOf(), false, "Maker address was successfully changed by non-owner");
    });
  });

  it("should register a bunch of whitelisted token holders", function() {
    return NectarController.deployed().then(function(instance) {
      liq = instance;
      return liq.register(accounts)
    }).then(function(response) {
      assert(liq.isOnList(accounts[3]), true)
    });
  });

});
