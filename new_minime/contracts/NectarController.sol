pragma solidity ^0.4.11;

import "./MiniMeToken.sol";
import "./WhiteList.sol";
import "./SafeMath.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/

contract NectarController is TokenController, Whitelist {
    using SafeMath for uint256;

    MiniMeToken public tokenContract;   // The new token for this Campaign
    address public vaultAddress;        // The address to hold the funds donated

    uint public periodLength = 7;       // Contribution windows length in days
    uint public startTime;              // Time of window 1 opening

    mapping (uint => uint) public windowFinalBlock;  // Final block before initialisation of new window


/// @dev There are several checks to make sure the parameters are acceptable
/// @param _vaultAddress The address that will store the donated funds
/// @param _tokenAddress Address of the token contract this contract controls

    function NectarController(
        address _vaultAddress,
        address _tokenAddress
    ) {
        require(_vaultAddress != 0);                // To prevent burning ETH
        tokenContract = MiniMeToken(_tokenAddress); // The Deployed Token Contract
        vaultAddress = _vaultAddress;
        startTime = block.timestamp;
        windowFinalBlock[0] = block.number-1;
    }

/// @dev The fallback function is called when ether is sent to the contract, it
/// simply calls `doPayment()` with the address that sent the ether as the
/// `_owner`. Payable is a required solidity modifier for functions to receive
/// ether, without this modifier functions will throw if ether is sent to them

    function ()  payable {
        doTakerPayment();
    }

    function contributeForMakers(address _owner) payable authorised {
        doMakerPayment(_owner);
    }

/////////////////
// TokenController interface
/////////////////

/// @notice `proxyPayment()` allows the caller to send ether to the Campaign and
/// have the tokens created in an address of their choosing
/// @param _owner The address that will hold the newly created tokens

    function proxyPayment(address _owner) payable returns(bool) {
        doTakerPayment();
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

/// @notice Notifies the controller about a burn attempt. Currently all burns are disabled.
/// Upgraded Controllers in the future will allow token holders to claim the pledged ETH
/// @param _owner The address that calls `burn()`
/// @param _amount The amount in the `burn()` call
/// @return False if the controller does not authorize the approval
    function onBurn(address _owner, uint _amount)
        returns(bool)
    {
        // In future version of controller, this will pay out rewards from vault,
        // destroy owner's tokens, and return true
        // Currently burning is not possible
        return false;
    }


/// @dev `doMakerPayment()` is an internal function that sends the ether that this
///  contract receives to the `vault` and creates tokens in the address of the
///  `_owner`who the fee contribution was sent by
/// @param _owner The address that will hold the newly created tokens

    function doMakerPayment(address _owner) internal {

        require ((tokenContract.controller() != 0) && (msg.value != 0) );
        tokenContract.pledgeFees(msg.value);
        require (vaultAddress.send(msg.value));
        uint256 newIssuance = getFeeToTokenConversion(msg.value);
        require (tokenContract.generateTokens(_owner, newIssuance));
        return;
    }

/// @dev `doTakerPayment()` is an internal function that sends the ether that this
///  contract receives to the `vault`

    function doTakerPayment() internal {

        require ((tokenContract.controller() != 0) && (msg.value != 0) );
        tokenContract.pledgeFees(msg.value);
        require (vaultAddress.send(msg.value));
        return;
    }

/// @notice `onlyOwner` changes the location that ether is sent
/// @param _newVaultAddress The address that will store the fees collected
    function setVault(address _newVaultAddress) onlyOwner {
        vaultAddress = _newVaultAddress;
    }

/// @notice `onlyOwner` can upgrade the controller contract
/// @param _newControllerAddress The address that will have the token control logic
    function upgradeController(address _newControllerAddress) onlyOwner {
        tokenContract.changeController(_newControllerAddress);
    }

/////////////////
// Issuance reward related functions - upgraded by changing controller
/////////////////

/// @dev getFeeToTokenConversion - Controller could be changed in the future to update this function
/// @param _contributed - The value of fees contributed during the window
    function getFeeToTokenConversion(uint256 _contributed) constant returns (uint256){
        // Set the block number which will be used to calculate issuance rate during
        // this 28 day window if it has not already been set
        if(windowFinalBlock[currentWindow()-1] == 0) {
            windowFinalBlock[currentWindow()-1] == block.number -1;
        }

        uint calculationBlock = windowFinalBlock[currentWindow()-1];
        uint256 previousSupply = tokenContract.totalSupplyAt(calculationBlock);
        uint256 initialSupply = tokenContract.totalSupplyAt(windowFinalBlock[0]);
        uint256 feeTotal = tokenContract.totalPledgedFeesAt(calculationBlock);
        return _contributed.mul(previousSupply.div(initialSupply.add(feeTotal)));
    }

    function currentWindow() constant returns (uint) {
       return windowAt(block.timestamp);
    }

    function windowAt(uint timestamp) constant returns (uint) {
      return timestamp < startTime
          ? 0
          : timestamp.sub(startTime).div(periodLength * 1 days) + 1;
    }

}
