const LivelyToken = artifacts.require("LivelyToken");

module.exports = function (deployer) {
  deployer.deploy(LivelyToken);
};
