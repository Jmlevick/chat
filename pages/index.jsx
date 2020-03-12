import "../styles/main.global.scss";

import React, { Component } from "react";
import { isEqual } from "lodash";
import HomePage from "./home";
import Modal from "../components/modal";
import Overlay from "../components/overlay";
import store from "../hover.store";

class ChatApp extends Component {
  state = {};

  componentDidMount() {
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

  render() {
    const { showModal } = this.state;
    return (
      <div id="chatApp">
        <section id="chatApp__react-wrapper">
          <HomePage />
        </section>
        {showModal && <Modal />}
        {showModal && <Overlay />}
      </div>
    );
  }
}

export default ChatApp;
