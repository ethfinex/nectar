pragma solidity ^0.4.11;

import "./MiniMeToken.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/

contract NEC is MiniMeToken, Whitelist {

  function NEC(
    address _tokenFactory
  ) MiniMeToken(
    _tokenFactory,
    0x0,                    // no parent token
    0,                      // no snapshot block number from parent
    "Ethfinex Nectar Token", // Token name
    18,                     // Decimals
    "NEC",                  // Symbol
    true                    // Enable transfers
    ) {}

    /// Basic ERC20 Function Forwarding - only allow transfer from and to whitelisted addresses
    function transfer(address _to, uint256 _value) isWhitelisted returns (bool success) {
      if (isOnList[_to]) {
        return super.transfer(_to, _value);
      } else {
        return;
      }
    }

    /// Basic ERC20 Function Forwarding - only allow transferFrom from and to whitelisted addresses
    function transferFrom(address _from, address _to, uint256 _value) isWhitelisted returns (bool success) {
      if (isOnList[_to]) {
        return super.transferFrom(_from, _to, _value);
      } else {
        return;
      }
    }
}
