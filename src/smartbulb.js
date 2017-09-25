const request = require('request');

class SmartBulb {

  constructor(token, device) {
    this.token = token;
    this.device = device;
  }

  setState(power, transition, temp, brightness) {
    return new Promise((resolve, reject) => {
      let command = {
        'smartlife.iot.smartbulb.lightingservice': {
          'transition_light_state': {
            'ignore_default': 1,
            'on_off': power ? 1 : 0,
            'transition_period': transition,
            'color_temp': temp,
            'brightness': brightness
          }
        }
      }

      let payload = {
        method: 'passthrough',
        params: {
          deviceId: this.device.deviceId,
          requestData: JSON.stringify(command)
        }
      }

      request.post({
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        qs: { token: this.token },
        url: this.device.appServerUrl,
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

module.exports = SmartBulb;