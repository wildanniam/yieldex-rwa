// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Simulation of the supported zero-fee share/rebase mechanism, not a clone with real backing.
contract DemoShareToken is ERC20, Ownable, Pausable {
    uint256 public constant SCALE = 1e18;
    uint256 public constant feePerPeriod = 0;
    uint256 public constant periodLength = 86400;

    struct History {
        uint256 previousMultiplier;
        uint256 newMultiplier;
        uint256 activationTime;
    }
    History[] public multiplierUpdates;
    mapping(address => uint256) public sharesOf;
    uint256 private totalShares;
    uint256 private resolvedMultiplier = SCALE;
    uint256 private resolvedNonce;
    uint256 public newMultiplier = SCALE;
    uint256 public newMultiplierNonce;
    uint256 public newMultiplierActivationTime;
    event TransferShares(address indexed from, address indexed to, uint256 shares);
    event DemoMultiplierScheduled(
        uint256 beforeValue, uint256 afterValue, uint256 nonce, uint256 effectiveAt
    );

    constructor(string memory name_, string memory symbol_, address operator)
        ERC20(name_, symbol_)
        Ownable(operator)
    {
        multiplierUpdates.push(History(SCALE, SCALE, 0));
    }

    function getCurrentMultiplier() public view returns (uint256 value, uint256 periods, uint256 nonce) {
        if (newMultiplierActivationTime > block.timestamp) return (resolvedMultiplier, 0, resolvedNonce);
        return (newMultiplier, 0, newMultiplierNonce);
    }

    function isPaused() external view returns (bool) {
        return paused();
    }

    function multiplierUpdatesLength() external view returns (uint256) {
        return multiplierUpdates.length;
    }

    function getUnderlyingAmountByShares(uint256 shares) public view returns (uint256) {
        (uint256 m,,) = getCurrentMultiplier();
        return Math.mulDiv(shares, m, SCALE);
    }

    function getSharesByUnderlyingAmount(uint256 amount) public view returns (uint256) {
        (uint256 m,,) = getCurrentMultiplier();
        return Math.mulDiv(amount, SCALE, m);
    }

    function totalSupply() public view override returns (uint256) {
        return getUnderlyingAmountByShares(totalShares);
    }

    function balanceOf(address account) public view override returns (uint256) {
        return getUnderlyingAmountByShares(sharesOf[account]);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function setPaused(bool value) external onlyOwner {
        if (value) _pause();
        else _unpause();
    }

    function schedule(uint256 value, uint256 nonce, uint64 effectiveAt) external onlyOwner {
        (uint256 current,, uint256 currentNonce) = getCurrentMultiplier();
        require(value > 0 && nonce > currentNonce, "invalid multiplier/nonce");
        require(
            effectiveAt >= block.timestamp && effectiveAt < block.timestamp + periodLength, "invalid schedule"
        );
        resolvedMultiplier = current;
        resolvedNonce = currentNonce;
        if (newMultiplierActivationTime > block.timestamp) multiplierUpdates.pop();
        newMultiplier = value;
        newMultiplierNonce = nonce;
        newMultiplierActivationTime = effectiveAt;
        multiplierUpdates.push(History(current, value, effectiveAt));
        emit DemoMultiplierScheduled(current, value, nonce, effectiveAt);
    }

    function transferShares(address to, uint256 shares) public virtual returns (bool) {
        require(to != address(0), "zero recipient");
        _moveShares(msg.sender, to, shares, getUnderlyingAmountByShares(shares));
        return true;
    }

    function _update(address from, address to, uint256 amount) internal override {
        _moveShares(from, to, getSharesByUnderlyingAmount(amount), amount);
    }

    function _moveShares(address from, address to, uint256 shares, uint256 amount) internal whenNotPaused {
        if (from == address(0)) {
            totalShares += shares;
        } else {
            require(sharesOf[from] >= shares, "insufficient shares");
            sharesOf[from] -= shares;
        }
        if (to == address(0)) totalShares -= shares;
        else sharesOf[to] += shares;
        emit Transfer(from, to, amount);
        emit TransferShares(from, to, shares);
    }
}
