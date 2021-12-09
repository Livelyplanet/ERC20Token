// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

/**
 * @dev This contract provides a fallback function that relay all calls to another contract using the EVM
 * instruction `call`. We refer to the second contract as the _implementation_ behind the forwarder, and it has to
 * be specified by overriding the virtual {_implementation} function.
 *
 * Additionally, forward to the implementation can be triggered manually through the {_fallback} function, or to a
 * different contract through the {_forward} function.
 *
 * The success and return data of the call will be returned back to the caller of the relay.
 */
contract Relay {
    address private _destContract;

    constructor(address destContract) {
        _destContract = destContract;
    }

    /**
     * @dev Forwards the current call to `implementation`.
     *
     * This function does not return to its internall call site, it will return directly to the external caller.
     */
    function _forward(uint256 value) internal {
        assembly {
            // loading state variable to stack
            let addr := sload(_destContract.slot)

            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := call(gas(), addr, value, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Forward the current call to the address returned by `_destContract`.
     *
     * This function does not return to its internall call site, it will return directly to the external caller.
     */
    function _fallback() internal virtual {
        _forward(msg.value);
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_destContract`. Will run if no other
     * function in the contract matches the call data.
     */
    // solhint-disable-next-line
    fallback() external payable virtual {
        _fallback();
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_destContract`. Will run if call data
     * is empty.
     */
    // solhint-disable-next-line
    receive() external payable virtual {
        _fallback();
    }
}
