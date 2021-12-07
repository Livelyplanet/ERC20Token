// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

contract Migrations {
    address public owner = msg.sender;
    uint256 public lastCompletedMigration;

    modifier restricted() {
        require(
            msg.sender == owner,
            "This function is restricted to the contract's owner"
        );
        _;
    }

    // solhint-disable-next-line
    function setCompleted(uint256 completed) public restricted {
        lastCompletedMigration = completed;
    }
}
