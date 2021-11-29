// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IAccessControl.sol";
import "./ERC165.sol";

/**
 * @dev Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Only account that have a role's admin role 
 * can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `CONSENSUS_ROLE`, which means
 * that only account with this role will be able to grant or revoke other
 * roles.
 *
 */
abstract contract AccessControl is IAccessControl, ERC165 {
    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
    bytes32 public constant BURNABLE_ROLE = keccak256("BURNABLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Role {
        bytes32 name;
        bool isEnabled;
    }

    bool private _firstInitConsensusRole;
    mapping(address => Role) private _roles;


    /**
     * @dev error Unauthorized, caller hasn't privilage access
     */
    error UnauthorizedError(address account);

    /**
     * @dev error ForbiddenError, caller call method or action is forbidden 
     */
    error ForbiddenError(address account);

    error RoleAddressNotFound(address account);

    /**
     * @dev error IllegalAddressError, caller destination account address is invalid
     */
    error IllegalAddressError(address account);

    /**
     * @dev error IllegalRevokeRole, Revoke role is invalid
     */
    error RoleMatchError();

    /**
     * @dev Grants `ADMIN_ROLE, `BURNABLE_ROLE` to the
     * account that deploys the contract.
     */
    constructor() {
        _setupRole(ADMIN_ROLE, msg.sender);
        // _setupRole(CONSENSUS_ROLE, msg.sender);
        _setupRole(BURNABLE_ROLE, msg.sender);
        _firstInitConsensusRole = true;
    }


    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier onlyRole(bytes32 role) {
        if (!_checkRole(role, msg.sender)) revert UnauthorizedError(msg.sender);
        _;
    }

    /**
     * @dev Modifier that checks that an account has a two specific roles. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier onlyRoles(bytes32 primaryRole, bytes32 secondaryRole) {
        if (!_checkRole(primaryRole, msg.sender) && !_checkRole(secondaryRole, msg.sender)) 
            revert UnauthorizedError(msg.sender);
        _;
    }

    modifier forbiddenAnyRole(address account) {
        if (_getRole(account).name != 0) revert ForbiddenError(account);
        _;
    }

    /**
     * @dev Modifier that checks that an account must doesn't equal with two specific addresses. 
     * Reverts with a IllegalAddressError(address account).
     */
    modifier validateAddress(address account) {
        if(account == address(0) || account == address(this)) 
            revert IllegalAddressError(account);
        _;
    }

    modifier validateAddresses(address account1, address account2) {
        if(account1 == address(0) || account1 == address(this))
            revert IllegalAddressError(account1);            
        if(account2 == address(0) || account2 == address(this))
            revert IllegalAddressError(account2);
        _;            
    }

    modifier validateSenderAddress {
        assert(address(0) != msg.sender);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) 
        public 
        view 
        override 
        returns (bool)
    {
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
    function grantRole(bytes32 role, address currentAccount, address newAccount) 
        external  
        override 
        onlyRole(CONSENSUS_ROLE)
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
    function revokeRole(bytes32 role, address account) external override onlyRole(CONSENSUS_ROLE) {
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
    function firstInitializeConsensusRole(address account) 
        external 
        onlyRole(ADMIN_ROLE)
        validateAddress(account)
    {
        if (!_firstInitConsensusRole) revert ForbiddenError(msg.sender);
        if (!_isContract(account)) revert IllegalAddressError(account);
        _firstInitConsensusRole = false;
        _grantRole(CONSENSUS_ROLE, msg.sender, account);
    }

    /**
     * @dev return false if `role` is missing account.
     * // TODO GAS optimazation with subsitutude multiple if with sload
     * // TODO check resutl struct map
     */
    function _checkRole(bytes32 role, address account) private view returns (bool) {
        Role storage roleInfo = _roles[account];
        if (roleInfo.name == 0) return false;
        return roleInfo.name == role && roleInfo.isEnabled;
    }

    /**
     * @dev Returns true if _firstInitConsensusRole is false.
     */
    function _isConsensusRoleInitailized() internal view returns(bool) {
        return !_firstInitConsensusRole;
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
        _roles[account] = Role(role, true);
    }

    // TODO check return value form map
    function _getRole(address account) internal view returns (Role memory) {
        return _roles[account];
    }


    // TODO check it update 
    function _grantRole(bytes32 role, address currentAccount, address newAccount) private {
        if(role == CONSENSUS_ROLE && !_isContract(newAccount)) revert IllegalAddressError(newAccount);
        Role memory roleInfo = _roles[currentAccount];
        if(roleInfo.name == 0) revert RoleAddressNotFound(currentAccount);
        if(roleInfo.name != role) revert RoleMatchError();
        roleInfo.isEnabled = true;
        delete _roles[currentAccount];
        _roles[newAccount] = roleInfo;
        emit RoleGranted(role, msg.sender, newAccount, currentAccount);
    }

    // TODO check it update 
    function _revokeRole(bytes32 role, address currentAccount) private {
        if(role == CONSENSUS_ROLE) revert ForbiddenError(currentAccount);
        Role storage roleInfo = _roles[currentAccount];
        if(roleInfo.name == 0) revert RoleAddressNotFound(currentAccount);
        if(roleInfo.name != role) revert RoleMatchError();
        roleInfo.isEnabled = false;
        // _roles[currentAccount] = roleInfo;
        emit RoleRevoked(role, msg.sender, currentAccount);
    }
}
