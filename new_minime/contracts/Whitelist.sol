pragma solidity ^0.4.11;


import "./Owned.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/


/// @title Whitelist contract - Only addresses which are registered as part of the market maker loyalty scheme can be whitelisted to earn and own Nectar tokens
contract Whitelist is Owned {

  // Only users who are on the whitelist
  modifier isWhitelisted () {
    require(isOnList[msg.sender]);
    _;
  }

  // Only authorised sources/contracts can contribute fees on behalf of makers to earn tokens
  modifier authorised () {
    require(isAuthorisedMaker[msg.sender]);
    _;
  }

  // This is the whitelist of users who are registered to be able to own the tokens
  mapping (address => bool) public isOnList;

  // This is a more select list of a few contracts or addresses which can contribute fees on behalf of makers, to generate tokens
  mapping (address => bool) public isAuthorisedMaker;


  /// @dev register
  /// @param newUsers - Array of users to add to the whitelist
  function register(address[] newUsers) onlyOwner {
    for (uint i = 0; i < newUsers.length; i++) {
      isOnList[newUsers[i]] = true;
    }
  }

  /// @dev deregister
  /// @param bannedUsers - Array of users to remove from the whitelist
  function deregister(address[] bannedUsers) onlyOwner {
    for (uint i = 0; i < bannedUsers.length; i++) {
      isOnList[bannedUsers[i]] = false;
    }
  }

  /// @dev authoriseMaker
  /// @param maker - Source to add to authorised contributors
  function authoriseMaker(address maker) onlyOwner {
      isAuthorisedMaker[maker] = true;
      // Also add any authorised Maker to the whitelist
      address[] memory makers = new address[](1);
      makers[0] = maker;
      register(makers);
  }

  /// @dev deauthoriseMaker
  /// @param maker - Source to remove from authorised contributors
  function deauthoriseMaker(address maker) onlyOwner {
      isAuthorisedMaker[maker] = false;
  }

  /////// Getters to allow the same whitelist to be used also by other contracts (including upgraded Controllers) ///////

  function getRegistrationStatus(address _user) constant external returns (bool) {
    return isOnList[_user];
  }

  function getAuthorisationStatus(address _maker) constant external returns (bool) {
    return isAuthorisedMaker[_maker];
  }

  function getOwner() external constant returns (address) {
    return owner;
  }


}
