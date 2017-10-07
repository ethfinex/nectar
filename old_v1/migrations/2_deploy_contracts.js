var LiquidityToken = artifacts.require("./LiquidityToken.sol");

module.exports = function(deployer) {
  deployer.deploy(LiquidityToken, 28, 100000000000000000000000);
};
