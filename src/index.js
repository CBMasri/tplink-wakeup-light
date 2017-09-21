const express = require('express');
const request = require('request');
const uuid = require('uuid/v4');

const TP_LINK_USER = process.env.TP_LINK_USER;
const TP_LINK_PASS = process.env.TP_LINK_PASS;
const TP_LINK_TERM = process.env.TP_LINK_TERM || uuid();
const TP_LINK_ALIAS = process.env.TP_LINK_ALIAS;

const TPLINK_PORTAL = 'https://wap.tplinkcloud.com';

class App {

  constructor() {
    this.appServerUrl = null;
    this.deviceList = null;
  }

  getToken(username, password, term) {
    console.log('getToken()');

    return new Promise((resolve, reject) => {
      // Params for the login request
      const params = {
        appType: 'Kasa_Android',
        cloudUserName: TP_LINK_USER,
        cloudPassword: TP_LINK_PASS,
        terminalUUID: TP_LINK_TERM
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

  getDevice(deviceList) {
    console.log('getDevice()');

    return new Promise((resolve, reject) => {
      if (!deviceList) {
        reject('Cannot get device without a valid list of devices');
      }
      for (let i = 0; i < deviceList.length; i++) {
        if (deviceList[i].alias === TP_LINK_ALIAS) {
          console.log('Device for alias %s found', TP_LINK_ALIAS);
          resolve(deviceList[i]);
        }
      }
      reject('No device id found for alias:', TP_LINK_ALIAS);
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
  app = new App();

  let myToken;
  let myDevice;
  
  app.getToken()
    .then(token => {
      myToken = token;
      return app.getDeviceList(token);
    })
    .then(deviceList => {
      return app.getDevice(deviceList);
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
