pragma solidity ^0.4.11;

 import './zeppelin/SafeMath.sol';

 /// @title RewardScheme contract - Logic for calculation of rewardRate separated from main contract for easy upgradeability
contract RewardScheme {
  using SafeMath for uint256;

  uint256 public startTime;
  uint256 public periodLength;

  function RewardScheme(uint256 _startTime, uint256 _periodLength){
    startTime = _startTime;
    periodLength = _periodLength;
  }

  /// @dev rewardRate The rate at which tokens are issued in each window, per fee contributed as a maker
  /// @param _previousSupply - Supply at the start of the window
  /// @param _initialSupply - Supply at contract deployment
  /// @param _totalFees - Total fees held in the contract at the start of the window
  function rewardRate(uint256 _previousSupply, uint256 _initialSupply, uint256 _totalFees, uint256 _windowFees) constant returns (uint256) {
    uint256 windowAllocation = _initialSupply*(9**(currentWindow())/10**(currentWindow()));
    return windowAllocation/_windowFees;
  }

  function currentWindow() constant returns (uint) {
      return windowFor(time());
  }

  function time() constant returns (uint) {
      return block.timestamp;
  }

  function windowFor(uint timestamp) constant returns (uint) {
      return timestamp < startTime
          ? 0
          : timestamp.sub(startTime).div(periodLength * 1 minutes) + 1;
  }

}
