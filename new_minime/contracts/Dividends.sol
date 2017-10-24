/*

Unaudited Rewards contract from jbaylina

https://gist.github.com/jbaylina/609f531532b38f17157d9932a5d03da9

To use modular as separate from main token contract


*/

pragma solidity ^0.4.4;

contract MiniMeToken {
    function balanceOfAt(address _owner, uint _blockNumber) constant returns (uint);
    function totalSupplyAt(uint _blockNumber) constant returns(uint);
}

contract Owned {
    /// Allows only the owner to call a function
    modifier onlyOwner { if (msg.sender != owner) throw; _; }

    address public owner;

    /// @return Returns the owner of this token
    function Owned() { owner = msg.sender;}

    /// @notice Changes the owner of the contract
    /// @param _newOwner The new owner of the contract
    function changeOwner(address _newOwner) onlyOwner {
        owner = _newOwner;
    }
}

contract RewardContract is Owned {

    MiniMeToken public token;

    mapping(address => uint) nextRefundToPay;

    struct Payment {
        uint block;
        uint amount;
    }

    Payment[] public payments;

    function RewardContract(address _token) {
        token = MiniMeToken(_token);
    }

    function newPayment() onlyOwner payable returns(bool) {
        if (msg.value == 0) return false;
        Payment payment = payments[payments.length ++];
        payment.block = block.number;
        payment.amount = msg.value;
        return true;
    }

    function getRewards() {
        uint acc = 0;
        uint i = nextRefundToPay[msg.sender];
        uint g;
        assembly {
            g:= gas
        }
        while (( i< payments.length) && ( g > 50000)) {
            Payment payment = payments[i];
            acc +=  payment.amount *
                    token.balanceOfAt(msg.sender, payment.block) /
                        token.totalSupplyAt(payment.block);
            i++;
            assembly {
                g:= gas
            }
        }
        nextRefundToPay[msg.sender] = i;
        if (!msg.sender.send(acc)) throw;
    }

    function getPendingReward(address _holder) constant returns(uint) {
        uint acc =0;
        for (uint i=nextRefundToPay[msg.sender]; i<payments.length; i++) {
            Payment payment = payments[i];
            acc +=  payment.amount *
                    token.balanceOfAt(msg.sender, payment.block) /
                        token.totalSupplyAt(payment.block);
        }
        return acc;
    }
}
