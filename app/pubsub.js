const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionPool,wallet }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;

    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();

    this.publisher.on('error', (err) => console.error('Publisher error:', err));
    this.subscriber.on('error', (err) => console.error('Subscriber error:', err));
  }

  async initialize() {
    await this.publisher.connect();
    await this.subscriber.connect();

    console.log('✅ Redis publisher and subscriber connected');

    await this.subscribeToChannels();

    this.subscriber.on('message', (channel, message) => this.handleMessage(channel, message));
  }

  handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (err) {
      console.error('Failed to parse message:', message);
      return;
    }

    switch(channel) {
        case CHANNELS.BLOCKCHAIN:
          this.blockchain.replaceChain(parsedMessage,true,()=>{
            this.transactionPool.clearBlockchainTransactions({
              chain: parsedMessage
            });
          });
          break;
        case CHANNELS.TRANSACTION:
          this.transactionPool.setTransaction(parsedMessage);
          break;
        case CHANNELS.TRANSACTION:
          if (!this.transactionPool.existingTransaction({
            inputAddress: this.wallet.publicKey
          })) {
            this.transactionPool.setTransaction(parsedMessage);
          }
          break;
        default:
          return;
    }
  }

  async subscribeToChannels() {
    for (const channel of Object.values(CHANNELS)) {
        try {
            await this.subscriber.subscribe(channel, (message, channelName) => {
                this.handleMessage(channelName, message);
            });
            console.log(`✅ Subscribed to ${channel}`);
        } catch (err) {
            console.error(`❌ Failed to subscribe to ${channel}:`, err);
        }
    }
  }


  async publish({ channel, message }) {
    try {
        await this.subscriber.unsubscribe(channel);
        console.log(`✅ Unsubscribed from ${channel} before publishing`);
        const msg = typeof message === 'string' ? message : JSON.stringify(message);
        console.log(`📦 Publishing to ${channel}: ${msg}`);
        const count = await this.publisher.publish(channel, msg);
        console.log(`✅ Message published to ${channel}. Subscriber count: ${count}`);
        await this.subscriber.subscribe(channel, (message, channelName) => {
            this.handleMessage(channelName, message);
        });
        console.log(`✅ Resubscribed to ${channel} after publishing`);
    } catch (err) {
      console.error(`❌ Failed to publish to ${channel}:`, err);
    }
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }
  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
}

module.exports = PubSub;
