// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface MockInterface {
    /**
     * @dev After calling this method, the mock will return `response` when it is called
     * with any calldata that is not mocked more specifically below
     * (e.g. using givenMethodReturn).
     * @param response ABI encoded response that will be returned if method is invoked
     */
    function givenAnyReturn(bytes calldata response) external;

    function givenAnyReturnBool(bool response) external;

    function givenAnyReturnUint(uint256 response) external;

    function givenAnyReturnAddress(address response) external;

    function givenAnyRevert() external;

    function givenAnyRevertWithMessage(string calldata message) external;

    function givenAnyRunOutOfGas() external;

    /**
     * @dev After calling this method, the mock will return `response` when the given
     * methodId is called regardless of arguments. If the methodId and arguments
     * are mocked more specifically (using `givenMethodAndArguments`) the latter
     * will take precedence.
     * @param method ABI encoded methodId. It is valid to pass full calldata (including arguments).
     * The mock will extract the methodId from it
     * @param response ABI encoded response that will be returned if method is invoked
     */
    function givenMethodReturn(bytes calldata method, bytes calldata response)
        external;

    function givenMethodReturnBool(bytes calldata method, bool response)
        external;

    function givenMethodReturnUint(bytes calldata method, uint256 response)
        external;

    function givenMethodReturnAddress(bytes calldata method, address response)
        external;

    function givenMethodRevert(bytes calldata method) external;

    function givenMethodRevertWithMessage(
        bytes calldata method,
        string calldata message
    ) external;

    function givenMethodRunOutOfGas(bytes calldata method) external;

    /**
     * @dev After calling this method, the mock will return `response` when the given
     * methodId is called with matching arguments. These exact _calldataMocks will take
     * precedence over all other _calldataMocks.
     * @param call ABI encoded calldata (methodId and arguments)
     * @param response ABI encoded response that will be returned if contract is invoked with calldata
     */
    function givenCalldataReturn(bytes calldata call, bytes calldata response)
        external;

    function givenCalldataReturnBool(bytes calldata call, bool response)
        external;

    function givenCalldataReturnUint(bytes calldata call, uint256 response)
        external;

    function givenCalldataReturnAddress(bytes calldata call, address response)
        external;

    function givenCalldataRevert(bytes calldata call) external;

    function givenCalldataRevertWithMessage(
        bytes calldata call,
        string calldata message
    ) external;

    function givenCalldataRunOutOfGas(bytes calldata call) external;

    /**
     * @dev Returns the number of times anything has been called on this mock since last reset
     */
    function invocationCount() external returns (uint256);

    /**
     * @dev Returns the number of times the given method has been called on this mock since last reset
     * @param method ABI encoded methodId. It is valid to pass full calldata (including arguments).
     * The mock will extract the methodId from it
     */
    function invocationCountForMethod(bytes calldata method)
        external
        returns (uint256);

    /**
     * @dev Returns the number of times this mock has been called with the exact calldata since last reset.
     * @param call ABI encoded calldata (methodId and arguments)
     */
    function invocationCountForCalldata(bytes calldata call)
        external
        returns (uint256);

    /**
     * @dev Resets all mocked methods and invocation counts.
     */
    function reset() external;
}

/**
 * Implementation of the MockInterface.
 */
contract MockContract is MockInterface {
    enum MockType {
        Return,
        Revert,
        OutOfGas
    }

    bytes32 public constant MOCKS_LIST_START = hex"01";
    bytes public constant MOCKS_LIST_END = "0xff";
    bytes32 public constant MOCKS_LIST_END_HASH = keccak256(MOCKS_LIST_END);
    bytes4 public constant SENTINEL_ANY_MOCKS = hex"01";
    bytes public constant DEFAULT_FALLBACK_VALUE = abi.encode(false);

    // A linked list allows easy iteration and inclusion checks
    mapping(bytes32 => bytes) private _calldataMocks;
    mapping(bytes => MockType) private _calldataMockTypes;
    mapping(bytes => bytes) private _calldataExpectations;
    mapping(bytes => string) private _calldataRevertMessage;
    mapping(bytes32 => uint256) private _calldataInvocations;

    mapping(bytes4 => bytes4) private _methodIdMocks;
    mapping(bytes4 => MockType) private _methodIdMockTypes;
    mapping(bytes4 => bytes) private _methodIdExpectations;
    mapping(bytes4 => string) private _methodIdRevertMessages;
    mapping(bytes32 => uint256) private _methodIdInvocations;

    MockType private _fallbackMockType;
    bytes private _fallbackExpectation = DEFAULT_FALLBACK_VALUE;
    string private _fallbackRevertMessage;
    uint256 private _invocations;
    uint256 private _resetCount;

    constructor() {
        _calldataMocks[MOCKS_LIST_START] = MOCKS_LIST_END;
        _methodIdMocks[SENTINEL_ANY_MOCKS] = SENTINEL_ANY_MOCKS;
    }

    function givenCalldataReturn(bytes calldata call, bytes calldata response)
        external
        override
    {
        _givenCalldataReturn(call, response);
    }

    function givenCalldataReturnBool(bytes calldata call, bool response)
        external
        override
    {
        uint256 flag = response ? 1 : 0;
        _givenCalldataReturn(call, _uintToBytes(flag));
    }

    function givenCalldataReturnUint(bytes calldata call, uint256 response)
        external
        override
    {
        _givenCalldataReturn(call, _uintToBytes(response));
    }

    function givenCalldataReturnAddress(bytes calldata call, address response)
        external
        override
    {
        _givenCalldataReturn(call, _uintToBytes(uint256(uint160(response))));
    }

    function givenAnyReturn(bytes calldata response) external override {
        _givenAnyReturn(response);
    }

    function givenAnyReturnBool(bool response) external override {
        uint256 flag = response ? 1 : 0;
        _givenAnyReturn(_uintToBytes(flag));
    }

    function givenAnyReturnUint(uint256 response) external override {
        _givenAnyReturn(_uintToBytes(response));
    }

    function givenAnyReturnAddress(address response) external override {
        _givenAnyReturn(_uintToBytes(uint256(uint160(response))));
    }

    function givenAnyRevert() external override {
        _fallbackMockType = MockType.Revert;
        _fallbackRevertMessage = "";
    }

    function givenAnyRevertWithMessage(string calldata message)
        external
        override
    {
        _fallbackMockType = MockType.Revert;
        _fallbackRevertMessage = message;
    }

    function givenAnyRunOutOfGas() external override {
        _fallbackMockType = MockType.OutOfGas;
    }

    function givenMethodReturn(bytes calldata call, bytes calldata response)
        external
        override
    {
        _givenMethodReturn(call, response);
    }

    function givenMethodReturnBool(bytes calldata call, bool response)
        external
        override
    {
        uint256 flag = response ? 1 : 0;
        _givenMethodReturn(call, _uintToBytes(flag));
    }

    function givenMethodReturnUint(bytes calldata call, uint256 response)
        external
        override
    {
        _givenMethodReturn(call, _uintToBytes(response));
    }

    function givenMethodReturnAddress(bytes calldata call, address response)
        external
        override
    {
        _givenMethodReturn(call, _uintToBytes(uint256(uint160(response))));
    }

    function givenCalldataRevert(bytes calldata call) external override {
        _calldataMockTypes[call] = MockType.Revert;
        _calldataRevertMessage[call] = "";
        _trackCalldataMock(call);
    }

    function givenMethodRevert(bytes calldata call) external override {
        bytes4 method = _bytesToBytes4(call);
        _methodIdMockTypes[method] = MockType.Revert;
        _trackMethodIdMock(method);
    }

    function givenCalldataRevertWithMessage(
        bytes calldata call,
        string calldata message
    ) external override {
        _calldataMockTypes[call] = MockType.Revert;
        _calldataRevertMessage[call] = message;
        _trackCalldataMock(call);
    }

    function givenMethodRevertWithMessage(
        bytes calldata call,
        string calldata message
    ) external override {
        bytes4 method = _bytesToBytes4(call);
        _methodIdMockTypes[method] = MockType.Revert;
        _methodIdRevertMessages[method] = message;
        _trackMethodIdMock(method);
    }

    function givenCalldataRunOutOfGas(bytes calldata call) external override {
        _calldataMockTypes[call] = MockType.OutOfGas;
        _trackCalldataMock(call);
    }

    function givenMethodRunOutOfGas(bytes calldata call) external override {
        bytes4 method = _bytesToBytes4(call);
        _methodIdMockTypes[method] = MockType.OutOfGas;
        _trackMethodIdMock(method);
    }

    function reset() external override {
        // Reset all exact _calldataMocks
        bytes memory nextMock = _calldataMocks[MOCKS_LIST_START];
        bytes32 mockHash = keccak256(nextMock);
        // We cannot compary bytes
        while (mockHash != MOCKS_LIST_END_HASH) {
            // Reset all mock maps
            _calldataMockTypes[nextMock] = MockType.Return;
            _calldataExpectations[nextMock] = hex"";
            _calldataRevertMessage[nextMock] = "";
            // Set next mock to remove
            nextMock = _calldataMocks[mockHash];
            // Remove from linked list
            _calldataMocks[mockHash] = "";
            // Update mock hash
            mockHash = keccak256(nextMock);
        }
        // Clear list
        _calldataMocks[MOCKS_LIST_START] = MOCKS_LIST_END;

        // Reset all any _calldataMocks
        bytes4 nextAnyMock = _methodIdMocks[SENTINEL_ANY_MOCKS];
        while (nextAnyMock != SENTINEL_ANY_MOCKS) {
            bytes4 currentAnyMock = nextAnyMock;
            _methodIdMockTypes[currentAnyMock] = MockType.Return;
            _methodIdExpectations[currentAnyMock] = hex"";
            _methodIdRevertMessages[currentAnyMock] = "";
            nextAnyMock = _methodIdMocks[currentAnyMock];
            // Remove from linked list
            _methodIdMocks[currentAnyMock] = 0x0;
        }
        // Clear list
        _methodIdMocks[SENTINEL_ANY_MOCKS] = SENTINEL_ANY_MOCKS;

        _fallbackExpectation = DEFAULT_FALLBACK_VALUE;
        _fallbackMockType = MockType.Return;
        _invocations = 0;
        _resetCount += 1;
    }

    function invocationCount() external view override returns (uint256) {
        return _invocations;
    }

    function invocationCountForMethod(bytes calldata call)
        external
        view
        override
        returns (uint256)
    {
        bytes4 method = _bytesToBytes4(call);
        return
            _methodIdInvocations[
                keccak256(abi.encodePacked(_resetCount, method))
            ];
    }

    function invocationCountForCalldata(bytes calldata call)
        external
        view
        override
        returns (uint256)
    {
        return
            _calldataInvocations[
                keccak256(abi.encodePacked(_resetCount, call))
            ];
    }

    // solhint-disable-next-line
    function updateInvocationCount(
        bytes4 methodId,
        bytes memory originalMsgData
    ) public {
        require(
            msg.sender == address(this),
            "Can only be called from the contract itself"
        );
        _invocations += 1;
        _methodIdInvocations[
            keccak256(abi.encodePacked(_resetCount, methodId))
        ] += 1;
        _calldataInvocations[
            keccak256(abi.encodePacked(_resetCount, originalMsgData))
        ] += 1;
    }

    function _givenAnyReturn(bytes memory response) internal {
        _fallbackMockType = MockType.Return;
        _fallbackExpectation = response;
    }

    function _trackCalldataMock(bytes memory call) private {
        bytes32 callHash = keccak256(call);
        if (_calldataMocks[callHash].length == 0) {
            _calldataMocks[callHash] = _calldataMocks[MOCKS_LIST_START];
            _calldataMocks[MOCKS_LIST_START] = call;
        }
    }

    function _trackMethodIdMock(bytes4 methodId) private {
        if (_methodIdMocks[methodId] == 0x0) {
            _methodIdMocks[methodId] = _methodIdMocks[SENTINEL_ANY_MOCKS];
            _methodIdMocks[SENTINEL_ANY_MOCKS] = methodId;
        }
    }

    function _givenCalldataReturn(bytes memory call, bytes memory response)
        private
    {
        _calldataMockTypes[call] = MockType.Return;
        _calldataExpectations[call] = response;
        _trackCalldataMock(call);
    }

    function _givenMethodReturn(bytes memory call, bytes memory response)
        private
    {
        bytes4 method = _bytesToBytes4(call);
        _methodIdMockTypes[method] = MockType.Return;
        _methodIdExpectations[method] = response;
        _trackMethodIdMock(method);
    }

    function _useAllGas() private {
        while (true) {
            bool s;
            assembly {
                //expensive call to EC multiply contract
                s := call(sub(gas(), 2000), 6, 0, 0x0, 0xc0, 0x0, 0x60)
            }
        }
    }

    function _bytesToBytes4(bytes memory b) private pure returns (bytes4) {
        bytes4 out;
        for (uint256 i = 0; i < 4; i++) {
            out |= bytes4(b[i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    function _uintToBytes(uint256 x) private pure returns (bytes memory b) {
        b = new bytes(32);
        assembly {
            mstore(add(b, 32), x)
        }
    }

    // solhint-disable-next-line
    receive() external payable {}

    // solhint-disable-next-line
    fallback() external payable {
        bytes4 methodId;
        assembly {
            methodId := calldataload(0)
        }

        // First, check exact matching overrides
        if (_calldataMockTypes[msg.data] == MockType.Revert) {
            revert(_calldataRevertMessage[msg.data]);
        }
        if (_calldataMockTypes[msg.data] == MockType.OutOfGas) {
            _useAllGas();
        }
        bytes memory result = _calldataExpectations[msg.data];

        // Then check method Id overrides
        if (result.length == 0) {
            if (_methodIdMockTypes[methodId] == MockType.Revert) {
                revert(_methodIdRevertMessages[methodId]);
            }
            if (_methodIdMockTypes[methodId] == MockType.OutOfGas) {
                _useAllGas();
            }
            result = _methodIdExpectations[methodId];
        }

        // Last, use the fallback override
        if (result.length == 0) {
            if (_fallbackMockType == MockType.Revert) {
                revert(_fallbackRevertMessage);
            }
            if (_fallbackMockType == MockType.OutOfGas) {
                _useAllGas();
            }
            result = _fallbackExpectation;
        }

        // Record invocation as separate call so we don't rollback in case we are called with STATICCALL
        (, bytes memory r) = address(this).call{gas: 100000}(
            abi.encodeWithSignature(
                "updateInvocationCount(bytes4,bytes)",
                methodId,
                msg.data
            )
        );
        assert(r.length == 0);

        assembly {
            return(add(0x20, result), mload(result))
        }
    }
}
