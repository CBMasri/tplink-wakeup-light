const express = require('express');
const request = require('request');
const uuid = require('uuid/v4');

const TPLINK_PORTAL = 'https://wap.tplinkcloud.com';

class App {

  getToken(username, password, term) {
    console.log('getToken()');

    return new Promise((resolve, reject) => {
      if (!username || !password || !term) {
        reject('One or more input parameters are missing');
      }

      // Params for the login request
      const params = {
        appType: 'Kasa_Android',
        cloudUserName: username,
        cloudPassword: password,
        terminalUUID: term
      };

      const payload = {
        method: 'login',
        params: params
      };

      request.post({
        headers: {
          'Connection': 'Keep-Alive',
          'Content-Type': 'application/json'
        },
        url: TPLINK_PORTAL,
        body: JSON.stringify(payload)
      }, function (error, response, body) {
        if (error) {
          reject(error);
        }
        let token = JSON.parse(body).result.token;
        console.log('Found token:', token);
        resolve(token);
      });
    }); 
  }

  getDeviceList(token) {
    console.log('getDeviceList()');

    return new Promise((resolve, reject) => {
      if (!token) {
        reject('Cannot fetch device list without a valid token');
      }
      request.post({
        headers: { 'Content-Type': 'application/json' },
        url: TPLINK_PORTAL,
        qs: { token: token },
        body: JSON.stringify({method: "getDeviceList"})
      }, function(error, response, body) {
        if (error) {
          reject(error);
        }
        let deviceList = JSON.parse(body).result.deviceList;
        if (deviceList.length === 0) {
          reject('No devices were found');
        }
        resolve(deviceList);
      });
    });
  }

  getDevice(deviceList, alias) {
    console.log('getDevice()');

    return new Promise((resolve, reject) => {
      if (!deviceList) {
        reject('Cannot get device without a valid list of devices');
      }
      for (let i = 0; i < deviceList.length; i++) {
        if (deviceList[i].alias === alias) {
          console.log('Device for alias %s found', alias);
          resolve(deviceList[i]);
        }
      }
      reject('No device id found for alias:', alias);
    });
  }

  turnOnLamp(token, device) {
    console.log('turnOnLamp()');

    return new Promise((resolve, reject) => {
      if (!token || !device) {
        reject('Cannot turn on lamp without device and auth token');
      }

      let params = {
        deviceId: device.deviceId,
        requestData: {
          'smartlife.iot.smartbulb.lightingservice': {
            'transition_light_state': {
              'on_off': '1',
              'brightness': '50',
              'hue': '0',
              'saturation': '0'
            } 
          }
        }
      }

      let payload = {
        method: 'passthrough',
        params: JSON.stringify(params)
      }

      console.dir(payload);

      request.post({
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        url: device.appServerUrl,
        body: JSON.stringify(payload)
      }, function(error, response, body) {
        if (error) {
          reject(error);
        }
        resolve(JSON.parse(body));
      });
    });
  }
}

class Bulb {
  constructor(token, deviceId) {
    
  }
}

(function() {
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

  app = new App();

  let myToken;
  let myDevice;
  
  app.getToken(user, pass, termId)
    .then(token => {
      myToken = token;
      return app.getDeviceList(token);
    })
    .then(deviceList => {
      return app.getDevice(deviceList, alias);
    })
    .then(device => {
      myDevice = device;
      return app.turnOnLamp(myToken, myDevice);
    })
    .then(result => {
      console.log(result);
    })
    .catch(err => console.log(err))

})();
