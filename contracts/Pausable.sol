// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./AccessControl.sol";
import "./IPausable.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused`,`whenPaused`, `whenNotPausedOf` and `whenPausedOf`, 
 * which can be applied to the functions of your contract.
 * Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is IPausable, AccessControl {   
    
    /**
     * @dev _isContractPaused used for contract pause state
     */
    bool private _isContractPaused;

    /**
     * @dev _pauses used for account pause state
     */
    mapping(address => bool) private _pauses;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {        
        _isContractPaused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        if(paused()) revert ForbiddenError(msg.sender);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        if(!paused()) revert ForbiddenError(msg.sender);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the account is not paused.
     * // TODO Gas optimization check
     */
    modifier whenNotPausedOf(address account) {
        if(pausedOf(account)) revert ForbiddenError(account);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the account is not paused.
     * // TODO Gas optimization check
     */
    modifier whenNotAccountsPausedOf(address firstAccount, address secondAccount) {
        if(pausedOf(firstAccount)) revert ForbiddenError(firstAccount);
        if(pausedOf(secondAccount)) revert ForbiddenError(secondAccount);
        _;
    }


    /**
     * @dev Modifier to make a function callable only when the account is paused.
     * // TODO Gas optimization check
     */
    modifier whenPausedOf(address account) {
        if(!pausedOf(account)) revert ForbiddenError(account);
        _;
    }

    /**
     * @dev See {IPausable-paused}.
     */
    function paused() public view override returns (bool) {
        return _isContractPaused;
    }

    /**
     * @dev See {IPausable-pausedOf}.
     */
    function pausedOf(address account) public view returns (bool) {
        return _pauses[account];
    }

    /**
     * @dev See {IPausable-pause}.
     */
    function pause(address account) 
        external 
        override 
        validateSenderRoles(CONSENSUS_ROLE, ADMIN_ROLE) 
        validateAddress(account)
    {
        _pauses[account] = true;
        emit Paused(msg.sender, account);
    }

    /**
     * @dev See {IPausable-unpause}.
     */
    function unpause(address account) 
        external  
        override
        validateSenderRoles(CONSENSUS_ROLE, ADMIN_ROLE) 
        validateAddress(account)
    {
        _pauses[account] = false;
        emit Unpaused(msg.sender, account);
    }

    /**
     * @dev See {IPausable-pauseAll}.
     */
    function pauseAll() external override validateSenderRole(CONSENSUS_ROLE) {
        _isContractPaused = true;
        emit PausedAll(msg.sender);
    }

    /**
     * @dev See {IPausable-unpauseAll}.
     */
    function unpauseAll() external override validateSenderRole(CONSENSUS_ROLE) {
        _isContractPaused = false;
        emit UnpausedAll(msg.sender);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override
        returns (bool) 
    {
        return interfaceId == type(IPausable).interfaceId || super.supportsInterface(interfaceId);
    }
}
