pragma solidity ^0.4.11;

import "./MiniMeToken.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/

contract NEC is MiniMeToken {

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
}
