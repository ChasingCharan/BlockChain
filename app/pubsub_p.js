const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-bcd81aef-270d-4f3b-be50-ad052d9b6c85',
    subscribeKey: 'sub-c-91ac07c8-9808-4723-860f-71de765d4103',
    secretKey: 'sec-c-YTgxNWY0OGItMWIwZC00MjU4LTk4ZjAtYjBjN2Q4YzkwYzcx',
    uuid: 'my-unique-hvjvydtexghvhfcfcchfxgfjhvhgcghx' 
};

const CHANNELS = {
  TEST: 'TEST'
};

class PubSub {
  constructor() {
    this.pubnub = new PubNub(credentials);

    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

    this.pubnub.addListener(this.listener());
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
      }
    };
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message })
      .then(response => console.log('Publish succeeded:', response))
      .catch(error => console.error('Publish error:', error));
  }
}

const testPubSub = new PubSub();
testPubSub.publish({ channel: CHANNELS.TEST, message: 'hello pubnub' });

module.exports = PubSub;
