var LiquidityToken = artifacts.require("./LiquidityToken.sol");

contract('LiquidityToken', function(accounts) {

  it("should put ETH in each month, mint, claim, and then move to next month", function() {
    LiquidityToken.new(28, 100000000000000000000000).then(function(newInstance){
        liq = newInstance;
      return liq.balanceOf.call(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 100000000000000000000000, "100000 wasn't set as the totalSupply in initialisation");
      return liq.contribute(accounts[0], true, {from: accounts[0], value: web3.toWei(3400, 'ether')});
    }).then(function(response) {
      return liq.incrementTestWindow();
    }).then(function(response) {
      return liq.claim(2, {from: accounts[0]});
    }).then(function(response) {
      return liq.balanceOf.call(accounts[0]);
    }).then(function(balance) {
      console.log("Window 1: " + balance.valueOf())
      return liq.contribute(accounts[0], true, {from: accounts[0], value: web3.toWei(3400, 'ether')});
    }).then(function(response) {
      return liq.incrementTestWindow();
    }).then(function(response) {
      return liq.claim(2, {from: accounts[0]});
    }).then(function(response) {
      return liq.balanceOf.call(accounts[0]);
    }).then(function(balance) {
      console.log("Window 2: " + balance.valueOf())
      return liq.contribute(accounts[0], true, {from: accounts[0], value: web3.toWei(3400, 'ether')});
    });
  });

});
