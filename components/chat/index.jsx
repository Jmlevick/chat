import React, { Component } from "react";
import { isEqual } from "lodash";
import styles from "./styles.scss";
import store from "../../hover.store";
import Bubble from '../bubble';
import PouchDBClient from "../../pouchdb.client";
import * as settings from '../../config';
import * as faye from 'faye';
import * as Cookies from 'js-cookie';


class Chat extends Component {

  cookie = Cookies.get('currentUser') || '';

  state = {
    chat__messages: [],
    messageBody: ""
  };

  fC = new faye.Client(`http://${settings.service_faye_host}:${settings.service_faye_port}/faye`);
  pouchDB = new PouchDBClient();

  componentDidMount() {
    this._ismounted = true;
    this.fayeSetup();
    store((state) => {
      const newState = Object.assign(state, {});
      this.unsubscribe = store(() => state);
      // Prevent unecessary local state updates & memory leaks
      if (!isEqual(this.state, newState) && this._ismounted) {
        this.setState(newState);
      } else {
        this.unsubscribe();
      }
    });
  }

  componentWillUnmount() {
    this._ismounted = false;
    this.unsubscribe();
  }


  openModal() {
    store.toggleModal(true);
  }


  inputEvtHandler = (e) => {
    const { name, value } = e.target;
    const data = {};
    data[`${name}`] = value;
    const newState = Object.assign(this.state, data);
    this.setState(newState);
  };

  sendMessage(e) {
    e.preventDefault();
    const { messageBody, chat__messages, username } = this.state;
    const memMessages = chat__messages;
    const user = this.cookie && this.cookie.length ? this.cookie : username;

    if (!user) {
      store.toggleModal(true);
    }

    let message = null;
    if (user && messageBody) {
      message = {
        data: {
          user: user, text: messageBody, timestamp: Date.now()
        }
      };
      memMessages.push(message.data)
      store.setData("chat__messages", memMessages);
      this.setState({ messageBody: "" })
      this.fC.publish(settings.service_faye_channel, message);
    } else {
      return false;
    }
  }

  fayeSetup() {
    const self = this;
    const cookie = this.cookie;
    // Client Extension  (ClientAuth)
    const { chat__messages } = this.state;
    const memMessages = chat__messages;
    const clientAuth = {
      incoming(message, callback) {
        if (message.channel === settings.service_faye_channel && message.data && message.data.text) {
          callback(message);
        } else if (message.channel === settings.service_faye_channel && message.data && message.data.notification === "unsubbed") {
          self.pouchDB.get(`${message.data.user}`).then((doc) => {
            self.pouchDB.destroy(doc);
          }).catch((err) => {
            if (err && err.message && (err.message === 'deleted' || err.message === 'missing')) {
              console.log("[INFO]", "peer disconnected");
            } else {
              console.log("[ERROR]", err);
            }
          });
        }
        callback(message);
      },
      outgoing(message, callback) {
        if (message.channel === settings.service_faye_channel || message.channel === '/meta/disconnect') {
          message.ext = {};
          message.ext.authToken = settings.server_hmac_token;
          message.ext.sender = "chatApp";
          message.ext.user = cookie;
          callback(message);
        }
        callback(message);
      }
    };

    this.fC.addExtension(clientAuth);
    const subscription = this.fC.subscribe(settings.service_faye_channel, (message) => {
      const cookie = this.cookie;
      if (message.data && message.data.user !== cookie) {
        memMessages.push(message.data)
        store.setData("chat__messages", memMessages);
      }
    });
    subscription.then(() => {
      if (subscription && subscription._client._state === 2) {
        console.log("[FAYE SOCKET] APP subscription is now active!");
      }
    });
  }

  render() {
    const { showModal, messageBody, chat__messages } = this.state;
    const cookie = this.cookie;
    return (
      <div className="animated fadeIn container">
        <main className="row">
          <div id="chat-component" className={`column ${styles.chat}`} style={{ zIndex: showModal ? 0 : "auto" }}>
            <p className={`wireframe__font ${styles.chat__title}`}>Moons Chat</p>
            <section className={styles.chat__header}>

              <div id="chat-configBtn" onClick={() => {
                this.openModal();
              }} className={styles.chat__header__configBtn}>
                <i className="material-icons">settings</i>
                <span className={styles.chat__header__configBtn__txt}>Config.</span>
              </div>
            </section>
            <section className={styles.chat__body}>
              {
                chat__messages.map((elem) => {
                  return <Bubble key={elem.timestamp} username={elem.user} text={elem.text} classNm={elem.user === cookie ? 'animated slideInRight meMsg' : 'animated slideInLeft othersMsg'} />
                })
              }
            </section>
            <section className={styles.chat__submitBox}>
              <input onChange={(e) => {
                this.inputEvtHandler(e);
              }}
                value={messageBody} className="wireframe__input" type="text"
                name="messageBody" />
              <button onClick={
                (e) => {
                  this.sendMessage(e)
                }
              } className="wireframe__button">Enviar</button>
            </section>
          </div>
        </main>
      </div>
    );
  }
}

export default Chat;
