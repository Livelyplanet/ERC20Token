// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IWallet {

    /**
     * @dev Sets `amount` as the allowance of `spender` 
     * over walletAccount by the ADMIN ro CONSENSUS roles.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits an {ApprovalFromWallet} event.
     */
    function approveFromWallet(
        address walletAccount,
        address spender, 
        uint256 currentAllowance, 
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event ApprovalFromWallet(
        address indexed owner, 
        address indexed spender, 
        uint256 currentAllowance, 
        uint256 value
    );
}