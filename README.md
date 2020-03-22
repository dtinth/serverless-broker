# serverless-broker

Nowadays in a serverless world, we would like to use serverless functions to bind and integrate multiple services together.

That is an ideal world… but sometimes, this is not possible yet due to **3rd party APIs**.

- Some services requires a persistent connection to the server to receive events. As the time of writing, [Discord](https://support.discordapp.com/hc/en-us/community/posts/360045382951-Outgoing-Webhooks), for example, requires running a bot process to listen to events. They don’t have outgoing webhooks like Slack.
- Other services may expose a [socket.io](http://socket.io) interface for clients to listen to events, but no webhooks.
- Some IoT services may use protocols like MQTT which also requires persistent connections to listen to messages.

Running a process continuously on an always-on server is not cost efficient.

**You want to be charged every 0.1 second of your code’s execution, not for the whole month, right???**

A cost-effective solution IMO is to run an old-school cloud server on a \$3.50 [Amazon Lightsail](https://aws.amazon.com/lightsail/) instance. This server will:

- connect to APIs that requires a persistent connection, listens to messages.
- forward messages as webhooks.
- optionally provide a web API to forward messages back to the 3rd party API.
- NOT do processing logic — as much as possible should be delegated to serverless endpoints.

This repository contains the code and setup information for that server.

## Server set-up

I used [**Bitnami Node.js Stack for AWS Cloud**](https://docs.bitnami.com/aws/infrastructure/nodejs/) as a starting point.

### Make systemd run our unit files on server start

```
sudo loginctl enable-linger bitnami
```

Reference: https://wiki.archlinux.org/index.php/Systemd/User

### Configure HTTPS

Configure a domain to point to the server IP address:

```
sudo /opt/bitnami/bncert-tool
```

Reference: https://docs.bitnami.com/aws/infrastructure/nodejs/administration/generate-configure-certificate-letsencrypt/

### Configure Apache

```
sudo mkdir /opt/bitnami/apps/serverless-broker
sudo chown bitnami:bitnami /opt/bitnami/apps/serverless-broker
rsync -rv bitnami/ bitnami@serverless-broker-server:/opt/bitnami/apps/serverless-broker/
```

Then [follow the steps in Bitnami’s documentation](https://docs.bitnami.com/aws/infrastructure/nodejs/administration/create-custom-application-nodejs/) to configure Apache.

### Configure SSH

In local machine `~/.ssh/config`:

```
Host serverless-broker-server
  Hostname <your.domain>
```

### Configure the broker

Create `config/serverless-broker/.env` in this repository (it is `.gitignore`’d):

```
SERVERLESS_BROKER_JWT_SECRET=<random_string>
SERVERLESS_BROKER_BASE_URL=https://<your_domain>
```

Create `config/serverless-broker/init.js`:

```js
module.exports = async runtime => {
  // Use `runtime.require` to require modules as the runtime.
  const SocketIO = runtime.require('socket.io-client')
  const Discord = runtime.require('discord.js')

  // `runtime.app` is the app server.
  runtime.app.get('/status', (req, res) => {
    res.send('it is running')
  })

  // Use these building blocks to connect to an API and
  // delegate logic to a serverless endpoint.
  // `fetch()` is available as a global.

  // TODO: Expand on this example.
}
```

### Build

```
yarn build
```

This uses `zeit/pkg` to generate a static Linux binary for the app.

### Deploy

```
yarn deploy
```

This uses `rsync` to copy the binaries, configuration files, and then SSH to restart the service. Very old school.
