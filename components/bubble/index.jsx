import React from "react";
import PropTypes from "prop-types";
import styles from "./styles.scss";

function Bubble(props) {
  const { username, text, classNm } = props;
  return (
    <div className={`${classNm} ${styles.bubble}`}>
      <span className={`wireframe__font ${styles.bubble__username}`}>{`${username}: `}</span>
      <section className={styles.bubble__message}>
        {text}
      </section>
    </div>
  );
}

Bubble.propTypes = {
  username: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  classNm: PropTypes.string.isRequired,
};

export default Bubble;
