// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./ComplexInterface.sol";

contract ExampleContractUnderTest {
    ComplexInterface private _complexInterface;

    constructor(address _complex) {
        _complexInterface = ComplexInterface(_complex);
    }

    function callMethodThatReturnsAddress() public returns (address) {
        address foo = _complexInterface.acceptUintReturnAddress(1);
        return foo;
    }

    function callMethodThatReturnsBool() public returns (bool) {
        return _complexInterface.acceptUintReturnBool(1);
    }

    function callMockedFunction3Times() public view returns (bool) {
        _complexInterface.acceptUintReturnUintView(1);
        _complexInterface.acceptUintReturnUintView(1);
        _complexInterface.acceptUintReturnUintView(1);
        return true;
    }
}
