pragma solidity ^0.4.11;

contract xAPIContract {

address public DEX_CONTRACT;
address public LIQUIDITY_TOKEN;

struct Order {
    address maker;
    address taker;
    address makerToken;
    address takerToken;
    address feeRecipient;
    uint makerTokenAmount;
    uint takerTokenAmount;
    uint makerFee;
    uint takerFee;
    uint expirationTimestampInSec;
    bytes32 orderHash;
}

function fill(Order order) internal {

  //uint filledTakerTokenAmount = Exchange(DEX_CONTRACT).fillOrder(order);
  // makerfee and takerfee both paid to the exchange contract
  // only makerfee triggers the generation of tokens
  //uint makerFee = order.makerFee*filledTakerTokenAmount/order.takerTokenAmount;
  address liquidityProvider = order.maker;

  // Turn the tokens into eth somehow
  uint makerFeeETH;
  uint takerFeeETH;

}


}


// Convert ZRX paid to it straight to ETH
// Submit fees and which end user maker they come from to Liquidity token
// Hold decentralised maker fees until point of execution
// Sign and approve everything required for Proxy/DEX
// Generate order

// Potentially also takers in the same contract, or in separate one?


// In fact - its not at all important what the maker does...
// Taker where this logic is important, since that is where orders execute
// Need some way of this contract being aware when one of its orders is met?
