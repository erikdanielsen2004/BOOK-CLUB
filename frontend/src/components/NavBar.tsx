import styles from './NavBar.module.css';

function NavBar()
{
  function doLogin(event:any) : void
  {
    event.preventDefault();

    alert('doIt()');
  }

    return(
           <div id="navDiv" className={styles.navContainer}>
           <button className={`${styles.btn} ${styles.about}`}>About Us</button>
        <button className={styles.btn}>Log In</button>
           <button className={styles.btn2}>Sign Up</button>
     </div>
    );
};

export default NavBar;
