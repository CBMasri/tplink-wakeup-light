const uuid = require('uuid/v4');

const TPLinkService = require('./tplink-service.js');
const Bulb = require('./bulb.js');

const user = process.env.TPLINK_USER;
const pass = process.env.TPLINK_PASS;
const termId = process.env.TPLINK_TERM || uuid();

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

let myToken;
let myBulb;

service.authenticate(user, pass, termId)
  .then(token => {
    myToken = token;
    return service.getDeviceList(token);
  })
  .then(deviceList => {
    return service.getDevice(deviceList, alias);
  })
  .then(device => {
    myBulb = new Bulb(myToken, device);
    // on_off, transition (ms), temp, brightness
    return myBulb.setState(true, 100000, 2700, 50);
  })
  .then(result => {
    console.log(result);
  })
  .catch(err => console.log(err))