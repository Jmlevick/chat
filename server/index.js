(() => {
  "use strict";
  require('dotenv').config();
  let faye;
  let deflate;
  let settings;
  let bayeux;
  let bayeux_client;
  let subscription;
  let clientAuth;
  let express;
  let server;
  let app;
  let serverAuth;
  let redis;

  settings = process.env;
  express = require("express");
  app = express();
  faye = require("faye");
  redis = require("faye-redis");
  deflate = require("permessage-deflate");
  server = app.listen(settings.service_faye_port);
  bayeux = new faye.NodeAdapter({
    mount: settings.service_faye_mount,
    timeout: settings.service_faye_timeout,
    ping: settings.service_faye_ping
  });

  bayeux.addWebsocketExtension(deflate);
  bayeux.attach(server);
  bayeux_client = new faye.Client(`http://${settings.service_faye_host}:${settings.service_faye_port}/faye`);

  // Server Extensions
  function clearToken(message) {
    if (message.ext && message.ext.authToken) {
      message.ext.authToken = null;
    }
    return message;
  }

  const authorized = message => {
    let auth = false;
    if (message.ext && message.ext.authToken && message.ext.authToken === settings.server_hmac_token) {
      auth = true;
    }
    return auth;
  };

  // Server Auth
  serverAuth = {
    incoming(message, callback) {
      if (message.channel === '/meta/disconnect' && message.ext) {
        bayeux_client.publish(settings.service_faye_channel, { notification: 'unsubbed', user: message.ext.user })
      }
      if (message.channel === `${settings.service_faye_channel}`) {
        if (!authorized(message)) {
          message.error = "403::Authentication required";
          message = clearToken(message);
          console.log("ERR", message.error, console.dir(message));
          return false;
        }
        message = clearToken(message);
      }
      message = clearToken(message);
      callback(message);
    }
  };

  // ClientAuth
  clientAuth = {
    outgoing(message, callback) {
      if (message.channel === `${settings.service_faye_channel}`) {
        message.ext = {};
        message.ext.authToken = settings.server_hmac_token;
        message.ext.sender = "server";
        callback(message);
      }
      callback(message);
    }
  };
  // Attach Extensions to Server
  bayeux.addExtension(serverAuth);
  bayeux_client.addExtension(clientAuth);

  // Server Subscription
  subscription = bayeux_client.subscribe(`${settings.service_faye_channel}`);
  if (subscription && subscription._client._state === 2) {
    console.log("[FAYE SOCKET] SERVER subscription is now active!");
  }
}).call(this);
