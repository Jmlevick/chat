import React, { Component } from "react";
import { isEqual } from "lodash";
import styles from "./styles.scss";
import store from "../../hover.store";
import PouchDBClient from "../../pouchdb.client";
import Utils from '../../utils.helper';
import * as Cookies from 'js-cookie';


class Modal extends Component {

  cookie = Cookies.get('currentUser') || '';

  state = {
    username: this.cookie,
    flash: null
  };


  componentDidMount() {
    this.pouchDB = new PouchDBClient();
    this._ismounted = true;

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

  sendData = (e) => {
    e.preventDefault();
    let { username } = this.state;
    username = Utils.slugify(username.trim());
    this.pouchDB.get(`${username || this.cookie}`).then((doc) => {
      if (Object.keys(doc).length) {
        if (this.cookie && this.cookie.length && (this.cookie !== doc._id)) {
          store.setData("flash", {
            status: 409, message: "[CONFLICT] Username already taken"
          });
        } else {
          store.setData("flash", null);
          store.setData("username", username);
          Cookies.set('currentUser', username, { expires: 1 });
          this.closeModal();
        }
      }
    }).catch((err) => {
      if (err.status && err.status === 404) {
        if (!this.cookie || !this.cookie.length) {
          this.pouchDB.create(`${username}`, { type: "user" });
          Cookies.set('currentUser', username, { expires: 1 });
        } else {
          this.pouchDB.upsert(this.cookie, { _id: (username && username.length ? username : this.cookie), type: "user" });
          Cookies.set('currentUser', (username && username !== " " ? username : this.cookie), { expires: 1 });
        }
        store.setData("flash", null);
        store.setData("username", username);
        this.closeModal();
      }
    });
  };

  inputEvtHandler = (e) => {
    const { name, value } = e.target;
    const data = {};
    data[`${name}`] = value || " ";
    const newState = Object.assign(this.state, data);
    this.setState(newState);
  };

  closeModal() {
    const { flash } = this.state;
    if (!flash) {
      store.toggleModal(false);
    }
  }

  render() {
    const { username, flash } = this.state;
    return (
      <div id="modal-component" className={`animated slideInDown container ${styles.modal}`}>
        <h1 className={styles.modal__title}>Your Nickname</h1>
        <section className={`row ${styles.modal__form}`}>
          <span
            id="modal-closeBtn"
            role="button"
            tabIndex="0"
            className={styles.modal__form__close}
            onClick={() => {
              this.closeModal();
            }}
          >
            X
          </span>


          <form
            id="modal-component__form"
            className={styles.modal__form__fields}
            onSubmit={(e) => {
              this.sendData(e);
            }}
          >
            <div>
              <input
                id="modal-username"
                name="username"
                type="text"
                className="wireframe__input"
                value={username || this.cookie}
                onChange={(e) => {
                  this.inputEvtHandler(e);
                }}
                placeholder="type here..."
              />
            </div>
            <div>
              <button className={`wireframe__button ${styles.modal__form__fields__submit}`} type="submit">Submit</button>
            </div>
            <p className="wireframe__font alert">{flash && flash.message && flash.message}</p>
          </form>
        </section>
      </div>
    );
  }
}

export default Modal;
