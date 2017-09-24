const uuid = require('uuid/v4');

const TPLinkService = require('./tplink-service.js');
const SmartBulb = require('./smartbulb.js');

const user = process.env.TPLINK_USER;
const pass = process.env.TPLINK_PASS;
const term = process.env.TPLINK_TERM || uuid();

// Alias of device to search for
// This is the same name that appears in the 'Kasa' app
const alias = process.env.TPLINK_ALIAS;

if (!user || !pass) {
  console.log('Error: Missing username or password');
  console.log('Please make sure the TPLINK_USER and TPLINK_PASS environment variables are set');
  process.exit(1);
}

if (!alias) {
  console.log('Error: Missing device alias');
  console.log('Please make sure that the TPLINK_ALIAS environment variable is set');
  process.exit(1);
}

let service = new TPLinkService();

let authToken;
let bulb;

service.authenticate(user, pass, term)
  .then(token => {
    authToken = token;
    return service.getDeviceList(token);
  })
  .then(deviceList => {
    return service.getDevice(deviceList, alias);
  })
  .then(device => {
    bulb = new SmartBulb(authToken, device);
    // power, transition (s), temp, brightness
    return bulb.setState(false, 1, 2700, 20);
  })
  .then(response => {
    console.log(response);
  })
  .catch(err => console.log(err))