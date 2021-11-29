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
     * @dev Moves `amount` tokens from `walletAccount` to `recipient`.
     * `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {TransferFromWallet} event.
     */
    function transferFromWallet(
        address walletAccount,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event TransferFromWallet(
        address indexed sender, 
        address indexed from, 
        address indexed to, 
        uint256 value
    );

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