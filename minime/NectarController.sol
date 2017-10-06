pragma solidity ^0.4.11;

import "./MiniMeToken.sol";
import "./WhiteList.sol";
import "./Owned.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/

contract NectarController is TokenController, Owned {

    uint public totalPledged;           // In wei
    MiniMeToken public tokenContract;   // The new token for this Campaign
    address public vaultAddress;        // The address to hold the funds donated


/// @dev There are several checks to make sure the parameters are acceptable
/// @param _startFundingTime The UNIX time that the Campaign will be able to
/// start receiving funds
/// @param _endFundingTime The UNIX time that the Campaign will stop being able
/// to receive funds
/// @param _maximumFunding In wei, the Maximum amount that the Campaign can
/// receive (currently the max is set at 10,000 ETH for the beta)
/// @param _vaultAddress The address that will store the donated funds
/// @param _tokenAddress Address of the token contract this contract controls

    function NectarController(
        address _vaultAddress,
        address _tokenAddress
    ) {
            (_vaultAddress != 0));                    // To prevent burning ETH
        tokenContract = MiniMeToken(_tokenAddress);// The Deployed Token Contract
        vaultAddress = _vaultAddress;
    }

    // After this controller becomes owner of the NEC token contract
    // Need to initialise the starting supply, and then start the first window
    // Check it can only be called once

/// @dev The fallback function is called when ether is sent to the contract, it
/// simply calls `doPayment()` with the address that sent the ether as the
/// `_owner`. Payable is a required solidity modifier for functions to receive
/// ether, without this modifier functions will throw if ether is sent to them

    function ()  payable {
        doPayment(msg.sender);
    }

/////////////////
// TokenController interface
/////////////////

/// @notice `proxyPayment()` allows the caller to send ether to the Campaign and
/// have the tokens created in an address of their choosing
/// @param _owner The address that will hold the newly created tokens

    function proxyPayment(address _owner) payable returns(bool) {
        doPayment(_owner);
        return true;
    }

/// @notice Notifies the controller about a transfer.
/// Transfers can only happen to whitelisted addresses
/// @param _from The origin of the transfer
/// @param _to The destination of the transfer
/// @param _amount The amount of the transfer
/// @return False if the controller does not authorize the transfer
    function onTransfer(address _from, address _to, uint _amount) returns(bool) {
        if (isOnList[_to] && isOnList[_from]) {
          return true;
        } else {
          return false;
        }
    }

/// @notice Notifies the controller about an approval, for this Campaign all
///  approvals are allowed by default and no extra notifications are needed
/// @param _owner The address that calls `approve()`
/// @param _spender The spender in the `approve()` call
/// @param _amount The amount in the `approve()` call
/// @return False if the controller does not authorize the approval
    function onApprove(address _owner, address _spender, uint _amount)
        returns(bool)
    {
        if (isOnList[_owner]) {
          return true;
        } else {
          return false;
        }
    }


/// @dev `doPayment()` is an internal function that sends the ether that this
///  contract receives to the `vault` and creates tokens in the address of the
///  `_owner` assuming the Campaign is still accepting funds
/// @param _owner The address that will hold the newly created tokens

    function doPayment(address _owner) internal {

        require ((tokenContract.controller() != 0) && (msg.value != 0) );
        totalPledged += msg.value;
        require (vaultAddress.send(msg.value));
        // How many tokens should be generated, comes down to the reward function
        require (tokenContract.generateTokens(_owner, msg.value));
        return;
    }


/// @notice `onlyOwner` changes the location that ether is sent
/// @param _newVaultAddress The address that will store the fees collected
    function setVault(address _newVaultAddress) onlyOwner {
        vaultAddress = _newVaultAddress;
    }

/// @dev getCurrentRewardRate - Reward scheme equations are upgradeable so that issuance and minting may change in the future if required
/// @param _previousSupply - Supply at the start of the window
/// @param _initialSupply - Supply at contract deployment
/// @param _totalFees - Total fees held in the contract at the start of the window
    function getCurrentRewardRate(uint256 _previousSupply, uint256 _initialSupply, uint256 _totalFees, uint256 _windowFees) constant returns (uint256){
      if (upgraded) {
        return RewardScheme(rewardRateUpgradedAddress).rewardRate(_previousSupply, _initialSupply, _totalFees, _windowFees);
      } else {
        return rewardRate(_previousSupply, _initialSupply, _totalFees, _windowFees);
      }
    }

/// Burn function which is disabled
can be called, calls destroy token on behalf of caller (except disabled)
then pays them out from pot of eth held by the controller
except that is zero in this, because all sent to vault
have a function to enable the burning and add some of the pledged eth back?
onlyOwner can enable it

}
