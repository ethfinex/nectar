var MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
var NEC = artifacts.require("./NEC.sol")
var NectarController = artifacts.require('./NectarController.sol')

const {getTime, mineBlock, timeJump} = require('./utils/utils.js')

let nectar
let controller
let factory

// Cold Storage
var efxVaultWallet = '0x66f3edf3865b9830911614462d5fd81a0a798808'

contract('24 months', function(accounts) {

  it('should be initialised with 1 billion NEC totalSupply for vault', async function () {
    factory = await MiniMeTokenFactory.new()
    nectar = await NEC.new(MiniMeTokenFactory.address, efxVaultWallet)
    controller = await NectarController.new(efxVaultWallet, nectar.address)

    supply = await nectar.totalSupply.call()
    assert.equal(supply.valueOf(), 1000000000000000000000000000, "1 billion wasn't set as the totalSupply in initialisation")
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
////// Rewards and contributions
////////////////////

// Possible monthly trade volume: 50 billion usd
// Volume is 50 million eth
// Assuming possible monthly fees contributable to be:
// Makers: 10000 eth
// Takers: 50000 eth

  it('pledge eth to create tokens in month 1', async function () {
    let balance0 = await nectar.balanceOf(accounts[0])

    await controller.proxyAccountingCreation(accounts[0], web3.toWei(50000, 'ether'), 0, {from: accounts[0]})
    let newTokens = await controller.getFeeToTokenConversion(web3.toWei(25000, 'ether'))
    await controller.proxyAccountingCreation(accounts[0], web3.toWei(25000, 'ether'), newTokens, {from: accounts[0]})

    let balance1 = await nectar.balanceOf(accounts[0])

    const sum = web3.toBigNumber(balance0).plus(web3.toBigNumber(newTokens))
    assert.equal(web3.toBigNumber(balance1).toString(10), sum.toString(10), 'maker did not receive correct tokens')
    console.log('Balance Mnth 0: ', web3.toBigNumber(balance0).shift(-18).toString(10))
    console.log('Balance Mnth 1: ', web3.toBigNumber(balance1).shift(-18).toString(10))
  })

  it('pledge eth to create tokens in month 2', async function () {

    await timeJump(30 * 24 * 60 * 60 + 10)
    await mineBlock()

    await controller.proxyAccountingCreation(accounts[0], web3.toWei(50000, 'ether'), 0, {from: accounts[0]})
    let newTokens = await controller.getFeeToTokenConversion(web3.toWei(25000, 'ether'))
    await controller.proxyAccountingCreation(accounts[0], web3.toWei(25000, 'ether'), newTokens, {from: accounts[0]})

    let balance2 = await nectar.balanceOf(accounts[0])
    console.log('Balance Mnth 2: ', web3.toBigNumber(balance2).shift(-18).toString(10))
  })

// Lets get loopy

  for (let i = 3; i < 24; i++) {
    it('is now month ' + i, async function () {
      await timeJump(30 * 24 * 60 * 60 + 10)
      await mineBlock()
      await controller.proxyAccountingCreation(accounts[0], web3.toWei(50000, 'ether'), 0, {from: accounts[0]})
      let newTokens = await controller.getFeeToTokenConversion(web3.toWei(25000, 'ether'))
      await controller.proxyAccountingCreation(accounts[0], web3.toWei(25000, 'ether'), newTokens, {from: accounts[0]})
      let balancex = await nectar.balanceOf(accounts[0])
      console.log('Balance Mnth '+ i +': ', web3.toBigNumber(balancex).shift(-18).toString(10))
    })
  }

})
