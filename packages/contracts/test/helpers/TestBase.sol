// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

interface Vm {
    function warp(uint256 time) external;
    function roll(uint256 number) external;
    function prank(address sender) external;
    function startPrank(address sender) external;
    function stopPrank() external;
    function expectRevert() external;
    function expectRevert(bytes4 selector) external;
    function expectRevert(bytes calldata reason) external;
    function createSelectFork(string calldata url, uint256 blockNumber) external returns (uint256);
    function envString(string calldata key) external returns (string memory);
    function load(address target, bytes32 slot) external view returns (bytes32);
    function mockCall(address target, bytes calldata data, bytes calldata returnData) external;
    function clearMockedCalls() external;
}

abstract contract TestBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address internal constant alice = address(0xA11CE);
    address internal constant bob = address(0xB0B);
    address internal constant carol = address(0xCA401);

    function eq(uint256 a, uint256 b) internal pure {
        require(a == b, "unequal uint");
    }

    function eq(address a, address b) internal pure {
        require(a == b, "unequal address");
    }
}
