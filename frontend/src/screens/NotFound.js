import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {
  return (
    <div className={styles.page}>
      <div className={styles.textContainer}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Oh Crumbs!</h2>
        <p className={styles.description}>Looks like the mouse escaped with the page you were looking for.</p>
        <Link to="/" className={styles.btn}>CHASE HIM HOME</Link>
      </div>

      <div className={styles.mouseHoleContainer}>
        <div className={styles.hole}>
          <div className={styles.eyes}>
            <div className={styles.eye}><div className={styles.pupil}></div></div>
            <div className={styles.eye}><div className={styles.pupil}></div></div>
          </div>
        </div>
      </div>

      <div className={styles.cheeseTrap}>
        <div className={styles.cheeseWedge}></div>
      </div>

      <div className={styles.floor}></div>

      <img src="/images/tom-and-jerry-1.png" alt="" className={styles.overlayImage1} />
      <img src="/images/tom-and-jerry-2.png" alt="" className={styles.overlayImage2} />
    </div>
  );
};

export default NotFound;
