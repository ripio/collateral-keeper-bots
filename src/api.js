//const axios = require('axios');

//const urlBase = '';

module.exports.report = (tableName, element) => {
  const message = {
    name: '<bot_name>',
    measurement: tableName,
    data: element,
  };

  send(message);
};

module.exports.reportError = (tableName, element, error) => {
  const message = {
    name: '<bot_name>',
    measurement: tableName,
    data: {
      element,
      error,
    },
  };

  send(message);
};

async function send(message) {
  console.log(message);
}