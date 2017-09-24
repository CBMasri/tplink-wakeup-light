const request = require('request');

const TPLINK_PORTAL = 'https://wap.tplinkcloud.com';

class TPLinkService {

  authenticate(username, password, term) {
    return new Promise((resolve, reject) => {
      if (!username || !password || !term) {
        reject('One or more input parameters are missing');
      }

      // Auth params
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
    return new Promise((resolve, reject) => {
      if (!deviceList) {
        reject('Cannot get device without a valid list of devices');
      }
      for (let i = 0; i < deviceList.length; i++) {
        if (deviceList[i].alias === alias) {
          console.log(`Device matching alias '${alias}' found`);
          resolve(deviceList[i]);
        }
      }
      reject(`No device found matching alias: ${alias}`);
    });
  }
}

module.exports = TPLinkService;