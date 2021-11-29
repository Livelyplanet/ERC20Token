// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IERC20.sol";
import "./IERC20Sec.sol";
import "./IFreezable.sol";
import "./IBurnable.sol";
import "./IMintable.sol";
import "./AccessControl.sol";
import "./Pausable.sol";
import "./Wallet.sol";

/**
 * @dev Implementation of the {IERC20, IERC20Sec} interfaces.
 */
contract LivelyToken is
    IERC20,
    IERC20Sec,
    IFreezable,
    IBurnable,
    IMintable,
    AccessControl,
    Pausable,
    Wallet
{
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(address => uint256) private _freezes;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    /**
     * @dev error IllegalArgumentError
     */
    error IllegalArgumentError();

    /**
     * @dev error IllegalBalanceError
     */
    error IllegalBalanceError();

    /**
     * @dev error IllegalTotalSupplyError
     */
    error IllegalTotalSupplyError();

    /**
     * @dev error IllegalAllowanceError
     */
    error IllegalAllowanceError();

    /**
     * @dev error IllegalWalletAddressError
     */
    error IllegalWalletAddressError();

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * The default value of {decimals} is 18. To select a different value for
     * {decimals} you should overload it.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor() {
        _name = "Lively";
        _symbol = "LVL";
        _totalSupply = 1_000_000_000;
        _balances[PUBLIC_SALE_WALLET_ADDRESS] = 500_000_000; // equivalent 50% total supply
        _balances[FOUNDING_TEAM_WALLET_ADDRESS] = 200_000_000; // equivalent 20% total supply
        _balances[RESERVES_WALLET_ADDRESS] = 100_000_000; // equivalent 10% total supply
        _balances[AUDIO_VIDEO_PRODUCTIONS_WALLET_ADDRESS] = 80_000_000; // equivalent 8% total supply
        _balances[BOUNTY_PROGRAMS_WALLET_ADDRESS] = 70_000_000; // equivalent 7% total supply
        _balances[CHARITY_WALLET_ADDRESS] = 50_000_000; // equivalent 5% total supply
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, Pausable, Wallet)
        returns (bool)
    {
        return
            interfaceId == type(IERC20).interfaceId ||
            interfaceId == type(IERC20Sec).interfaceId ||
            interfaceId == type(IBurnable).interfaceId ||
            interfaceId == type(IMintable).interfaceId ||
            interfaceId == type(IPausable).interfaceId ||
            interfaceId == type(IFreezable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() external view override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() external pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account)
        external
        view
        override
        returns (uint256)
    {
        return _balances[account];
    }

    /**
     * @dev See {IFreezable-freezeOf}.
     */
    // TODO test for address(0x0)
    function freezeOf(address account) external view returns (uint256) {
        return _freezes[account];
    }

    /**
     * @dev See {IFreezable-freeze}.
     */
    function freeze(uint256 currentFreezeBalance, uint256 amount)
        external
        override
        whenNotPaused
        whenNotPausedOf(msg.sender)
        returns (uint256 newFreezeBalance)
    {
        newFreezeBalance = _freeze(msg.sender, currentFreezeBalance, amount);
        emit Freeze(msg.sender, currentFreezeBalance, amount);
        return newFreezeBalance;
    }

    /**
     * @dev See {IFreezable-unfreeze}.
     */
    function unfreeze(uint256 currentFreezeBalance, uint256 amount)
        external
        override
        whenNotPaused
        whenNotPausedOf(msg.sender)
        returns (uint256 newFreezeBalance)
    {
        newFreezeBalance = _unfreeze(msg.sender, currentFreezeBalance, amount);
        emit Unfreeze(msg.sender, currentFreezeBalance, amount);
        return newFreezeBalance;
    }

    /**
     * @dev See {IFreezable-freezeFrom}.
     */
    function freezeFrom(
        address account,
        uint256 currentFreezeBalance,
        uint256 amount
    )
        external
        override
        whenNotPaused
        whenNotPausedOf(account)
        validateSenderRoles(CONSENSUS_ROLE, ADMIN_ROLE)
        validateAddress(account)
        returns (uint256 newFreezeBalance)
    {
        newFreezeBalance = _freeze(account, currentFreezeBalance, amount);
        emit FreezeFrom(msg.sender, account, currentFreezeBalance, amount);
        return newFreezeBalance;
    }

    /**
     * @dev See {IFreezable-unfreezeFrom}.
     */
    function unfreezeFrom(
        address account,
        uint256 currentFreezeBalance,
        uint256 amount
    )
        external
        override
        whenNotPaused
        whenNotPausedOf(account)
        validateSenderRoles(CONSENSUS_ROLE, ADMIN_ROLE)
        validateAddress(account)
        returns (uint256 newFreezeBalance)
    {
        newFreezeBalance = _unfreeze(account, currentFreezeBalance, amount);
        emit UnfreezeFrom(msg.sender, account, currentFreezeBalance, amount);
        return newFreezeBalance;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount)
        public
        override
        whenNotPaused
        whenNotAccountsPausedOf(msg.sender, recipient)
        forbiddenAnyRole(msg.sender)
        returns (bool)
    {
        _transfer(msg.sender, recipient, amount);
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IWallet-approveFromWallet} 
     */
    function approveFromWallet(
        address walletAccount,
        address spender,
        uint256 currentAllowance,
        uint256 amount
    )
        external
        override
        whenNotPaused
        whenNotPausedOf(walletAccount)
        validateSenderRoles(CONSENSUS_ROLE, ADMIN_ROLE)
        returns (bool)
    {
        WalletInfo storage walletInfo = _wallets[walletAccount];
        if (walletInfo.name != 0) revert IllegalWalletAddressError();
        Role storage role = _getRole(msg.sender);
        if (role.name == ADMIN_ROLE && walletInfo.role != ADMIN_ROLE)
            revert UnauthorizedError(msg.sender);

        uint256 currentAllowanceAccount = _allowances[walletAccount][spender];
        if (currentAllowanceAccount != currentAllowance)
            revert IllegalAllowanceError();
        _allowances[walletAccount][spender] = amount;

        emit ApprovalFromWallet(
            walletAccount,
            spender,
            currentAllowanceAccount,
            amount
        );
        return true;
    }

    /**
     * @dev  See {IWallet-transferFromWallet} 
     */
    function transferFromWallet(
        address walletAccount,
        address recipient,
        uint256 amount
    )
        external
        whenNotPaused
        whenNotAccountsPausedOf(walletAccount, recipient)
        validateSenderRoles(CONSENSUS_ROLE, ADMIN_ROLE)
        returns (bool)
    {
        WalletInfo storage walletInfo = _wallets[walletAccount];
        if (walletInfo.name != 0) revert IllegalWalletAddressError();
        Role storage role = _getRole(msg.sender);
        if (role.name == ADMIN_ROLE && walletInfo.role != ADMIN_ROLE)
            revert UnauthorizedError(msg.sender);

        uint256 walletBalance = _balances[walletAccount];
        if (walletBalance < amount) revert IllegalBalanceError();

        unchecked {
            _balances[walletAccount] = walletBalance - amount;
        }

        _balances[recipient] += amount;
        emit TransferFromWallet(msg.sender, walletAccount, recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount)
        public
        override
        whenNotPaused
        whenNotPausedOf(msg.sender)
        forbiddenAnyRole(msg.sender)
        returns (bool)
    {
        _approve(msg.sender, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    )
        external
        override
        whenNotPaused
        whenNotAccountsPausedOf(sender, recipient)
        forbiddenAnyRole(msg.sender)
        returns (bool)
    {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][msg.sender];
        if (currentAllowance < amount) revert IllegalAllowanceError();
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }

        emit Transfer(sender, recipient, amount);
        return true;
    }

     /**
     * @dev See {IERC20Sec-transferFromSec}.
     */
    function transferFromSec(
        address sender,
        address recipient,
        uint256 amount
    )
        external
        override
        whenNotPaused
        whenNotAccountsPausedOf(sender, recipient)
        forbiddenAnyRole(msg.sender)
        returns (bool)
    {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][msg.sender];
        if (currentAllowance < amount) revert IllegalAllowanceError();
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }

        emit TransferFromSec(msg.sender, sender, recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20Sec-approveSec}.
     */
    function approveSec(
        address spender,
        uint256 currentAllowance,
        uint256 amount
    )
        external
        override
        whenNotPaused
        whenNotAccountsPausedOf(msg.sender, spender)
        forbiddenAnyRole(msg.sender)
        returns (bool success)
    {
        uint256 currentAllowanceAccount = _allowances[msg.sender][spender];
        if (currentAllowanceAccount != currentAllowance)
            revert IllegalAllowanceError();
        _allowances[msg.sender][spender] = amount;

        emit ApprovalSec(msg.sender, spender, currentAllowanceAccount, amount);
        return true;
    }

    /**
     * @dev See {IERC20Sec-increaseAllowanceSec}.
     */
    function increaseAllowanceSec(
        address spender,
        uint256 currentAllowance,
        uint256 value
    )
        external
        whenNotPaused
        whenNotPausedOf(msg.sender)
        forbiddenAnyRole(msg.sender)
        returns (bool)
    {
        uint256 currentAllowanceAccount = _allowances[msg.sender][spender];
        if (currentAllowanceAccount != currentAllowance)
            revert IllegalAllowanceError();
        _allowances[msg.sender][spender] = currentAllowanceAccount + value;

        emit ApprovalSec(msg.sender, spender, currentAllowanceAccount, value);
        return true;
    }

    /**
     * @dev See {IERC20Sec-decreaseAllowanceSec}.
     */
    function decreaseAllowanceSec(
        address spender,
        uint256 currentAllowance,
        uint256 value
    )
        external
        whenNotPaused
        whenNotPausedOf(msg.sender)
        forbiddenAnyRole(msg.sender)
        returns (bool)
    {
        uint256 currentAllowanceAccount = _allowances[msg.sender][spender];
        if (currentAllowanceAccount < value) revert IllegalArgumentError();
        if (currentAllowanceAccount != currentAllowance)
            revert IllegalAllowanceError();
        unchecked {
            _allowances[msg.sender][spender] = currentAllowanceAccount - value;
        }

        emit ApprovalSec(msg.sender, spender, currentAllowanceAccount, value);
        return true;
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(
        address account,
        uint256 currentAccountBalance,
        uint256 currentTotalSupply,
        uint256 amount
    )
        external
        override
        whenPaused
        validateSenderRole(CONSENSUS_ROLE)
        validateAddress(account)
    {
        if (_balances[account] != currentAccountBalance)
            revert IllegalBalanceError();
        if (_totalSupply != currentTotalSupply)
            revert IllegalTotalSupplyError();
        _totalSupply += amount;
        _balances[account] += amount;
        emit Mint(msg.sender, account, amount);
    }

    function burnFrom(
        address account,
        uint256 currentBalance,
        uint256 currentTotalSupply,
        uint256 amount
    )
        external
        override
        whenPaused
        validateSenderRoles(CONSENSUS_ROLE, BURNABLE_ROLE)
        validateAddress(account)
        returns (uint256 newBalance, uint256)
    {
        if (_totalSupply != currentTotalSupply)
            revert IllegalTotalSupplyError();

        uint256 currentAccountBalance = _balances[account];
        if (currentAccountBalance != currentBalance)
            revert IllegalBalanceError();
        if (currentAccountBalance < amount) revert IllegalArgumentError();

        unchecked {
            newBalance = currentAccountBalance - amount;
        }

        _balances[account] = newBalance;
        _totalSupply -= amount;

        emit BurnFrom(
            msg.sender,
            account,
            currentBalance,
            currentTotalSupply,
            amount
        );
        return (newBalance, _totalSupply);
    }

    /**
     * @dev Moves `amount` of tokens from `sender` to `recipient`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal validateAddresses(sender, recipient) {
        uint256 senderBalance = _balances[sender];
        if (senderBalance < amount) revert IllegalBalanceError();
        unchecked {
            _balances[sender] = senderBalance - amount;
        }
        _balances[recipient] += amount;
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal validateAddresses(owner, spender) {
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Sets `amount` as the freeze(stake) of `account`.
     */
    function _freeze(
        address account,
        uint256 currentFreezeBalance,
        uint256 amount
    ) internal returns (uint256 newFreezeBalance) {
        uint256 currentBalance = _balances[account];
        if (currentBalance < amount) revert IllegalArgumentError();

        uint256 currentFreeze = _freezes[account];
        if (currentFreezeBalance != currentFreeze) revert IllegalBalanceError();

        newFreezeBalance = currentFreeze + amount;
        _freezes[account] = newFreezeBalance;

        unchecked {
            _balances[account] = currentBalance - amount;
        }
        return newFreezeBalance;
    }

    /**
     * @dev Unfreeze `amount` of `account`.
     */
    function _unfreeze(
        address account,
        uint256 currentFreezeBalance,
        uint256 amount
    ) internal returns (uint256 newFreezeBalance) {
        uint256 currentFreeze = _freezes[account];
        if (currentFreeze < amount) revert IllegalArgumentError();
        if (currentFreezeBalance != currentFreeze) revert IllegalBalanceError();

        _balances[account] += amount;

        unchecked {
            newFreezeBalance = currentFreeze - amount;
        }

        _freezes[account] = newFreezeBalance;
        return newFreezeBalance;
    }

    // experimental
    function withdrawContractBalance(address recepient)
        external
        validateSenderRole(CONSENSUS_ROLE)
    {
        payable(recepient).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
