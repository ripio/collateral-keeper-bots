const Bot = require('./Bot.js');
const api = require('../api.js');
const { PAID_DEBT_STATUS, address0x, getOracleData } = require('../utils.js');

module.exports = class Claimer extends Bot {
  async elementsLength() {
    try {
      return await process.contracts.collateral.methods.getEntriesLength().call();
    } catch (error) {
      console.log('#Claimer/elementsLength/Error:\n', error);
      return 0;
    }
  }

  async getEntry(id) {
    const entry = await process.contracts.collateral.methods.entries(id).call();

    return {
      debtId: entry.debtId,
      amount: entry.amount,
      oracle: entry.oracle,
      token: entry.token,
      liquidationRatio: entry.liquidationRatio,
      balanceRatio: entry.balanceRatio,
    };
  }

  async createElement(id) {
    try {
      const entry = await this.getEntry(id);
      const debt = await process.contracts.debtEngine.methods.debts(entry.debtId).call();
      let dueTime;

      try {
        process.contracts.model._address = debt.model;
        dueTime = await process.contracts.model.methods.getDueTime(entry.debtId).call();
      } catch(error) {
        dueTime = null;
      }

      return {
        id,
        entry,
        debtOracle: debt.oracle,
        dueTime
      };
    } catch(error) {
      api.reportError('#Claimer/createElement/Error', id, error);
      return false;
    }
  }

  async isAlive(element) {
    try {
      element.entry = await this.getEntry(element.id);
      if (!element.entry) // If the entry was deleted
        return 'The entry was deleted or not exist';

      const debtStatus = await process.contracts.loanManager.methods.getStatus(element.entry.debtId).call();
      if (debtStatus !== PAID_DEBT_STATUS)
        return { alive: true };
      else
        return { alive: false, reason: 'The debt of the entry was paid' };
    } catch (error) {
      api.reportError('#Claimer/isAlive/Error', element, error);
      return { alive: false, reason: 'The isAlive function have an error' };
    }
  }

  async canSendTx(element) {
    try {
      const debtToEntry = await process.contracts.collateral.methods.debtToEntry(element.entry.debtId).call();

      if (element.entry.amount == 0 || debtToEntry == 0)
        return false;

      return await process.contracts.collateral.methods.canClaim(
        element.entry.debtId,
        await getOracleData(element.debtOracle)
      ).call();
    } catch (error) {
      api.reportError('#Claimer/canSendTx/Error', element, error);
      return false;
    }
  }

  async sendTx(element) {
    const debtOracleData = await getOracleData(element.debtOracle);

    const tx = await process.walletManager.sendTx(
      process.contracts.collateral.methods.claim(
        address0x,
        element.entry.debtId,
        debtOracleData
      )
    );

    if (tx instanceof Error)
      api.reportError('#Claimer/sendTx/EntryOnError', element, tx);
  }

  elementsAliveLog() {
    console.log('#Claimer/Total Entries alive:', this.totalAliveElement);
  }
};