var LiquidityToken = artifacts.require("./LiquidityToken.sol");

contract('LiquidityToken', function(accounts) {

  it("should put 100000 NEC in the first account", function() {
    return LiquidityToken.deployed().then(function(instance) {
      return instance.balanceOf.call(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 100000000000000000000000, "100000 wasn't set as the totalSupply in initialisation");
    });
  });

  it("should be possible to check we are in the first window", function() {
    return LiquidityToken.deployed().then(function(instance) {
      return instance.currentWindow();
    }).then(function(window) {
      assert.equal(window.valueOf(), 1, "Current window did not return 1");
    });
  });

  it("should be possible for the owner to authorise an address to contribute maker fees", function() {
    return LiquidityToken.deployed().then(function(instance) {
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

  it("should not be possible for anyone else to toggle authorised users", function() {
    return LiquidityToken.deployed().then(function(instance) {
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

  it("should register a bunch of authorised token holders", function() {
    return LiquidityToken.deployed().then(function(instance) {
      liq = instance;
      return liq.register([accounts[1], accounts[2], accounts[3]])
    }).then(function(response) {
      assert(liq.isOnList(accounts[3]), true)
    });
  });

  it("should update window total fees when a maker sends funds", function() {
    return LiquidityToken.deployed().then(function(instance) {
      liq = instance;
      return liq.contribute(accounts[1], true, {from: accounts[1], value: web3.toWei(1, 'ether')});
    }).then(function(response) {
      return liq.windowTotalFees(1);
    }).then(function(feesIn) {
      assert.equal(feesIn.valueOf(), web3.toWei(1, 'ether'), "Fee was not successfully contributed");
      return liq.feeContributions(1, accounts[1]);
    }).then(function(makerContributed) {
      assert.equal(makerContributed.valueOf(), web3.toWei(1, 'ether'), "Fee was not attributed to the maker");
      return liq.feeContributions(1, accounts[0]);
    }).then(function(ownerContributed) {
      assert.equal(ownerContributed.valueOf(), 0, "Nothing");
    });
  });

  it("should not be possible to claim before window has completed", function() {
    return LiquidityToken.deployed().then(function(instance) {
      liq = instance;
      return liq.currentWindow()
    }).then(async function (window) {
      try{
        await liq.claim(window, {from: accounts[1]});
      } catch(e){
        assert.isAbove((e+"").indexOf("invalid opcode"),-1,"exception not thrown")
      }
    }).then(function(response) {
    });
  });

// These tests require currentWindow to be over written with a mockup version

it("should move to the second window", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.incrementTestWindow();
  }).then(function(result) {
    return liq.currentWindow();
  }).then(function(window) {
    assert.equal(window.valueOf(), 2, "Current window did not return 2");
  });
});

it("user can now claim for first window and their tokens are minted", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.claim(1, {from: accounts[1]});
  }).then(function(result) {
    return liq.balanceOf.call(accounts[0]);
  }).then(function(balance) {
    assert.equal(balance.valueOf(), 100000000000000000000000, "Owner balance incorrectly changed");
    return liq.balanceOf.call(accounts[1]);
  }).then(function(balance) {
    assert.equal(balance.valueOf(), 1000000000000000000, "New token balance incorrect");
    return liq.tokensClaimed.call(1,accounts[1]);
  }).then(function(result) {
    assert.equal(result, true);
  });
});

it("two more users can contribute during this window, one as a maker and one as a taker", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.contribute(accounts[2], true, {from: accounts[0], value: web3.toWei(2, 'ether')});
  }).then(function(result) {
    return liq.contribute(accounts[3], false, {from: accounts[0], value: web3.toWei(4, 'ether')});
  }).then(function(result) {
    return liq.windowTotalFees(2);
  }).then(function(feesIn) {
    assert.equal(feesIn.valueOf(), web3.toWei(6, 'ether'), "Incorrect fee accounting");
    return liq.feeContributions(2, accounts[2]);
  }).then(function(contributed) {
    assert.equal(contributed.valueOf(), web3.toWei(2, 'ether'), "Maker not correctly credited");
    return liq.feeContributions(2, accounts[3]);
  }).then(function(contributed) {
    assert.equal(contributed.valueOf(), 0, "Taker incorrectly credited");
  });
});

it("is possible to for owner to do a batch contribution of fees", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.batchContribute([accounts[4],accounts[5],accounts[6]], [web3.toWei(1,'ether'),web3.toWei(2,'ether'),web3.toWei(3,'ether')], {from: accounts[0], value: web3.toWei(6, 'ether')});
  }).then(function(result){
    return liq.windowTotalFees(2);
  }).then(function(feesIn) {
    assert.equal(feesIn.valueOf(), web3.toWei(12, 'ether'), "Incorrect fee accounting");
    return liq.feeContributions(2, accounts[4]);
  }).then(function(contributed) {
    assert.equal(contributed.valueOf(), web3.toWei(1, 'ether'), "Maker not correctly credited");
    return liq.feeContributions(2, accounts[5]);
  }).then(function(contributed) {
    assert.equal(contributed.valueOf(), web3.toWei(2, 'ether'), "Maker not correctly credited");
  })
})

it("should move to the third window", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.incrementTestWindow();
  }).then(function(result) {
    return liq.currentWindow();
  }).then(function(window) {
    assert.equal(window.valueOf(), 3, "Current window did not return 3");
  });
});

it("should be possible to mint all tokens from previous window and assign to 0x00", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.initialSupply.call();
  }).then(function(result) {
    assert.equal(result.valueOf(), 100000000000000000000000, "Initial supply messed up");
    return liq.cumulativeFeesAtStartOfWindow.call(2)
  }).then(function(result) {
    assert.equal(result.valueOf(), web3.toWei(1, 'ether'), "Total fees messed up");
    return liq.totalSupplyAtStartOfWindow.call(2);
  }).then(function(result) {
    assert.equal(result.valueOf(), 100001000000000000000000, "Previous supply messed up");
    return liq.balanceOf.call('0x0000000000000000000000000000000000000000');
  }).then(function(result) {
    assert.equal(result.valueOf(), 0, "There were already unclaimed tokens")
    return liq.mintNewTokens(2);
  }).then(function(response) {
    return liq.balanceOf.call('0x0000000000000000000000000000000000000000')
  }).then(function(minted) {
    // calculate how many tokens we really think should be minted here
    assert.equal(minted.valueOf(), 12000000000000000000, "Wrong value");
  });
});

it("users can claim their minted tokens", function() {
  return LiquidityToken.deployed().then(function(instance) {
    liq = instance;
    return liq.claim(2, {from: accounts[4]});
  }).then(function(result) {
    return liq.balanceOf.call(accounts[4]);
  }).then(function(balance) {
    assert.equal(balance.valueOf(), 1000000000000000000, "Token balance incorrectly changed");
  });
})

});
