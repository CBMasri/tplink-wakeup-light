const uuid = require('uuid/v4');

const TPLinkService = require('./tplink-service.js');
const SmartBulb = require('./smartbulb.js');

const settings = require('./default.json');

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

// Number of minutes until light is full brightness
const timeToWake = settings.timeToWake || 10;
const minTemp = settings.minTemp || 2700;
const maxTemp = settings.maxTemp || 5000;
const minBrightness = settings.minBrightness || 0;
const maxBrightness = settings.maxBrightness || 100;

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
    return bulb.setState(true, 10000, minTemp, minBrightness);
  })
  .then(response => {
    log(response);
    return sleep(120000);   // sleep two minutes
  })
  .then(() => {
    console.log(`Light will be fully bright in ${timeToWake} minutes`);

    let transition = timeToWake * 60 * 1000 / 5;  // 5 equal time segments (ms)
    let temp = (maxTemp - minTemp) / 5;
    let brightness = maxBrightness / 5;

    let currentTemp = minTemp + temp;
    let currentBrightness = minBrightness + brightness;

    return bulb.setState(true, transition, currentTemp, currentBrightness)
      .then(response => {
        log(response);
        currentTemp += temp;
        currentBrightness += brightness;
        return sleep(transition);
      })
      .then(() => {
        return bulb.setState(true, transition, currentTemp, currentBrightness)
      })
      .then(response => {
        log(response);
        currentTemp += temp;
        currentBrightness += brightness;
        return sleep(transition);
      })
      .then(() => {
        return bulb.setState(true, transition, currentTemp, currentBrightness)
      })
      .then(response => {
        log(response);
        currentTemp += temp;
        currentBrightness += brightness;
        return sleep(transition);
      })
      .then(() => {
        return bulb.setState(true, transition, currentTemp, currentBrightness)
      })
      .then(response => {
        log(response);
        currentTemp += temp;
        currentBrightness += brightness;
        return sleep(transition);
      })
      .then(() => {
        return bulb.setState(true, transition, currentTemp, currentBrightness)
      })
      .then(response => log(response))
  })
  .catch(err => console.log(err))

function sleep(n) {
  return new Promise(resolve => setTimeout(resolve, n));
}

function log(response) {
  let responseData = JSON.parse(response.result.responseData);
  let state = responseData['smartlife.iot.smartbulb.lightingservice'];
  console.log(state);
  return state;
}