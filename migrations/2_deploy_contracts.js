var MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
var NEC = artifacts.require('./NEC.sol')
var NectarController = artifacts.require('./NectarController.sol')

// Cold Storage
var efxVaultWallet = '0x66f3edf3865b9830911614462d5fd81a0a798808'

// This is the order required to deploy the contracts. The controller of NEC is later set as the NectarController contract
module.exports = function (deployer) {
  deployer.deploy(MiniMeTokenFactory)
    .then(function () {
      return deployer.deploy(NEC, MiniMeTokenFactory.address, efxVaultWallet)
    })
    .then(function (result) {
      return deployer.deploy(NectarController, efxVaultWallet, NEC.address)
    })
}
