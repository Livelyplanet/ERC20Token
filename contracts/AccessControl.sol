// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IAccessControl.sol";
import "./ERC165.sol";

/**
 * @dev Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Only account that have a role's consensus role 
 * can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role is `CONSENSUS_ROLE`, which means
 * that only account with this role will be able to grant or revoke other
 * roles.
 *
 */
abstract contract AccessControl is IAccessControl, ERC165 {
    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
    bytes32 public constant BURNABLE_ROLE = keccak256("BURNABLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    bool private _isConsenusRoleInitialized;
    bool private _isBurnableRoleInitialized;
    mapping(address => bytes32) private _roles;

    /**
     * @dev error Unauthorized, caller hasn't privilage access
     */
    error UnauthorizedError(address account);

    /**
     * @dev error ForbiddenError, caller call method or action is forbidden
     */
    error ForbiddenError(address account);

    /**
     * @dev error AddressNotFoundError
     */
    error AddressNotFoundError(address account);

    /**
     * @dev error IllegalAddressError, caller destination account address is invalid
     */
    error IllegalAddressError(address account);

    /**
     * @dev error IllegalRoleError, Revoke role is invalid
     */
    error IllegalRoleError();

    /**
     * @dev error DuplicateAddressRoleError
     */
    error DuplicateAddressRoleError(address account);

    /**
     * @dev Grants `ADMIN_ROLE to the
     * account that deploys the contract.
     */
    constructor() {
        _setupRole(ADMIN_ROLE, msg.sender);
        _isConsenusRoleInitialized = false;
        _isBurnableRoleInitialized = false;
    }

    /**
     * @dev Modifier that checks that a sender has a specific role. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier validateSenderRole(bytes32 role) {
        if (!_checkRole(role, msg.sender)) revert UnauthorizedError(msg.sender);
        _;
    }

    /**
     * @dev Modifier that checks that a sender has a two specific roles. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier validateSenderRoles(bytes32 primaryRole, bytes32 secondaryRole) {
        if (
            !_checkRole(primaryRole, msg.sender) &&
            !_checkRole(secondaryRole, msg.sender)
        ) revert UnauthorizedError(msg.sender);
        _;
    }

    /**
     * @dev Modifier that checks that an account must doesn't equal with two specific addresses.
     * Reverts with a IllegalAddressError(address account).
     */
    modifier validateAddress(address account) {
        if (account == address(0) || account == address(this))
            revert IllegalAddressError(account);
        _;
    }

    /**
     * @dev Modifier that checks that each of account must not equal with two specific addresses.
     * Reverts with a IllegalAddressError(address account).
     */
    modifier validateAddresses(address account1, address account2) {
        if (account1 == address(0) || account1 == address(this))
            revert IllegalAddressError(account1);
        if (account2 == address(0) || account2 == address(this))
            revert IllegalAddressError(account2);
        _;
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
        return
            interfaceId == type(IAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account)
        public
        view
        override
        validateAddress(account)
        returns (bool)
    {
        if (role == 0) return false;
        return _checkRole(role, account);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s CONSENSUS_ROLE role.
     */
    function grantRole(
        bytes32 role,
        address currentAccount,
        address newAccount
    )
        external
        override
        validateSenderRole(CONSENSUS_ROLE)
        validateAddresses(currentAccount, newAccount)
    {
        _grantRole(role, currentAccount, newAccount);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s CONSENSUS_ROLE role.
     */
    function revokeRole(bytes32 role, address account)
        external
        override
        validateSenderRole(CONSENSUS_ROLE)
    {
        _revokeRole(role, account);
    }

    /**
     * @dev Grants `CONSENSUS_ROLE` to `contract account` by ADMIN_ROLE only once.
     *
     * [WARNING]
     * ====
     * This function should only be called by ADMIN_ROLE when
     * setting up the CONSENSUS_ROLE for the system.
     * ====
     */

    function _firstInitializeConsensusRole(address account) internal {
        if (_isConsenusRoleInitialized) revert ForbiddenError(msg.sender);
        if (!_isContract(account)) revert IllegalAddressError(account);
        if (_roles[account] != 0) revert DuplicateAddressRoleError(account);
        _isConsenusRoleInitialized = true;
        _roles[account] = CONSENSUS_ROLE;
    }

    /**
     * @dev return false if account hasn't any role.
     */
    function _checkRole(bytes32 role, address account)
        private
        view
        returns (bool)
    {
        return _roles[account] == role;
    }

    /**
     * @dev Returns true if _isConsenusRoleInitialized is true.
     */
    function _isConsensusRoleInitailized() internal view returns (bool) {
        return _isConsenusRoleInitialized;
    }

    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     */
    /* solhint-disable */
    function _isContract(address account) private view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /* solhint-enable */

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     */
    function _setupRole(bytes32 role, address account) internal {
        _roles[account] = role;
    }

    function _getRole(address account) internal view returns (bytes32) {
        return _roles[account];
    }

    function _grantRole(
        bytes32 role,
        address currentAccount,
        address newAccount
    ) private {
        if (role == CONSENSUS_ROLE && !_isContract(newAccount))
            revert IllegalAddressError(newAccount);
        if (_roles[newAccount] != 0)
            revert DuplicateAddressRoleError(newAccount);

        if (role == BURNABLE_ROLE && !_isBurnableRoleInitialized) {
            _isBurnableRoleInitialized = true;
        } else {
            bytes32 roleInfo = _roles[currentAccount];
            if (roleInfo == 0) revert AddressNotFoundError(currentAccount);
            if (roleInfo != role) revert IllegalRoleError();
            delete _roles[currentAccount];
        }

        _roles[newAccount] = role;
        emit RoleGranted(role, msg.sender, newAccount, currentAccount);
    }

    function _revokeRole(bytes32 role, address currentAccount) private {
        if (role == CONSENSUS_ROLE) revert ForbiddenError(currentAccount);
        bytes32 roleInfo = _roles[currentAccount];

        if (roleInfo == 0) revert AddressNotFoundError(currentAccount);
        if (roleInfo != role) revert IllegalRoleError();

        delete _roles[currentAccount];
        emit RoleRevoked(role, msg.sender, currentAccount);
    }
}
