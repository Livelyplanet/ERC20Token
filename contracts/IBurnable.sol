// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
interface IBurnable {

    // /**
    //  * @dev Destroys `amount` tokens from the caller. 
    //  * the caller must send currentBalance of account and
    //  * currentTotalSupply of token
    //  *
    //  * See {ERC20-burn}.
    //  */
    // function burn(
    //     uint256 currentBalance, 
    //     uint256 currentTotalSupply, 
    //     uint256 amount
    // ) external returns (uint256 newBalance, uint256 newTotalSupply);


    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance. the caller must send currentBalance of account and
     * currentTotalSupply of token
     *
     * See {ERC20-burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` cannot be the contract address.
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(
        address account, 
        uint256 currentBalance, 
        uint256 currentTotalSupply, 
        uint256 amount
    ) external returns (uint256, uint256);


    // /**
    //  * @dev Emitted when the burn of a `amount` for an `account` is set by
    //  * a call to {burn}. 
    //  * Note: msg.sender is equivalent to account
    //  * `amount` subtracted from the oldBalance and `oldTotalSupply`.
    //  */
    // event Burn(
    //     address indexed account, 
    //     uint256 oldBalance, 
    //     uint256 oldTotalSupply, 
    //     uint256 amount
    // );

    /**
     * @dev Emitted when the burnFrom of a `amount` for an `account` from caller is set by 
     * a call to {burnFrom}. 
     * `amount` subtracted from the oldBalance of account and oldTotalSupply.
     * `from` is msg.sender. 
     */
    event BurnFrom(
        address indexed from,
        address indexed account,
        uint256 oldBalance, 
        uint256 oldTotalSupply, 
        uint256 amount
    );
}