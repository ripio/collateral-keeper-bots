module.exports.PAID_DEBT_STATUS = '2';

module.exports.address0x = '0x0000000000000000000000000000000000000000';
module.exports.bytes320x = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports.sleepThread = async () => {
  return await this.sleep(process.configDefault.AWAIT_THREAD);
};

module.exports.sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports.bn = (number) => {
  return process.web3.utils.toBN(number);
};

module.exports.bytes32 = (number) => {
  return process.web3.utils.toTwosComplement(number);
};

module.exports.getBlock = async (number = 'latest') => {
  for (let block, i = 0; ; await this.sleep(++i * 100)) {
    try {
      block = await process.web3.eth.getBlock(number);
    } catch (error) {
      console.log('#Utils/getBLock/Error', '\n', error.message);
    }

    if (block)
      return block;
  }
};

module.exports.getOracleData = async (oracle) => {
  if (oracle === this.address0x)
    return '0x';

  return '0x';

  // TODO If the oracle needs a data
  process.contracts.rateOracle.methods.url().to = oracle;
  const oracleUrl = await process.callManager.call(
    process.contracts.rateOracle.methods.url()
  );

  // If dont have URL, the oracle data its empty
  if (oracleUrl instanceof Error || oracleUrl == '0x' || oracleUrl == '' || oracleUrl == null)
    return '0x';

  throw new Error('TODO: get oracle data from url and return the oracle data:', oracleUrl);
};

module.exports.convertToken = async (oracle, amount) => {
  amount = this.bn(amount);

  if (oracle == this.address0x)
    return amount;

  const method = process.contracts.rateOracle.methods.readSample('0x');
  method.to = oracle;
  const sample = await process.callManager.multiCall(
    method
  );

  return amount.mul(this.bn(sample._tokens)).div(this.bn(sample._equivalent));
};