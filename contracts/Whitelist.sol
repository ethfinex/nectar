pragma solidity ^0.4.18;


import "./Owned.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/


/// @title Whitelist contract - Only addresses which are registered as part of the market maker loyalty scheme can be whitelisted to earn and own Nectar tokens
contract Whitelist is Owned {

  function Whitelist() {
    admins[msg.sender] = true;
  }

  bool public listActive = true;

  // Only users who are on the whitelist
  function isRegistered(address _user) public constant returns (bool) {
    if (!listActive) {
      return true;
    } else {
      return isOnList[_user];
    }
  }

  // Can add people to the whitelist
  function isAdmin(address _admin) public view returns(bool) {
    return admins[_admin];
  }

  /// @notice The owner is able to add new admin
  /// @param _newAdmin Address of new admin
  function addAdmin(address _newAdmin) public onlyOwner {
    admins[_newAdmin] = true;
  }

  /// @notice Only owner is able to remove admin
  /// @param _admin Address of current admin
  function removeAdmin(address _admin) public onlyOwner {
    admins[_admin] = false;
  }

  // Only authorised sources/contracts can contribute fees on behalf of makers to earn tokens
  modifier authorised () {
    require(isAuthorisedMaker[msg.sender]);
    _;
  }

  modifier onlyAdmins() {
    require(isAdmin(msg.sender));
    _;
  }

  // These admins are able to add new users to the whitelist
  mapping (address => bool) public admins;

  // This is the whitelist of users who are registered to be able to own the tokens
  mapping (address => bool) public isOnList;

  // This is a more select list of a few contracts or addresses which can contribute fees on behalf of makers, to generate tokens
  mapping (address => bool) public isAuthorisedMaker;


  /// @dev register
  /// @param newUsers - Array of users to add to the whitelist
  function register(address[] newUsers) public onlyAdmins {
    for (uint i = 0; i < newUsers.length; i++) {
      isOnList[newUsers[i]] = true;
    }
  }

  /// @dev deregister
  /// @param bannedUsers - Array of users to remove from the whitelist
  function deregister(address[] bannedUsers) public onlyAdmins {
    for (uint i = 0; i < bannedUsers.length; i++) {
      isOnList[bannedUsers[i]] = false;
    }
  }

  /// @dev authoriseMaker
  /// @param maker - Source to add to authorised contributors
  function authoriseMaker(address maker) public onlyOwner {
      isAuthorisedMaker[maker] = true;
      // Also add any authorised Maker to the whitelist
      address[] memory makers = new address[](1);
      makers[0] = maker;
      register(makers);
  }

  /// @dev deauthoriseMaker
  /// @param maker - Source to remove from authorised contributors
  function deauthoriseMaker(address maker) public onlyOwner {
      isAuthorisedMaker[maker] = false;
  }

  function activateWhitelist(bool newSetting) public onlyOwner {
      listActive = newSetting;
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
