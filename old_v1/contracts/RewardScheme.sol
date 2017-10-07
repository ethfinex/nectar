pragma solidity ^0.4.11;

 import './zeppelin/SafeMath.sol';

 /// @title RewardScheme contract - Logic for calculation of rewardRate separated from main contract for easy upgradeability
contract RewardScheme {
  using SafeMath for uint256;

  /// @dev rewardRate The rate at which tokens are issued in each window, per fee contributed as a maker
  /// @param _previousSupply - Supply at the start of the window
  /// @param _initialSupply - Supply at contract deployment
  /// @param _totalFees - Total fees held in the contract at the start of the window
  function rewardRate(uint256 _previousSupply, uint256 _initialSupply, uint256 _totalFees, uint256 _windowFees) constant returns (uint256) {
    // Scaling factor of 10000 taking out on other side to improvise decimal places
    return (10000*_previousSupply)/(_initialSupply +_totalFees);
  }

}
