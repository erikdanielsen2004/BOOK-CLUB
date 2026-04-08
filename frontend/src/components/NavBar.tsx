import { useNavigate } from 'react-router-dom';
import styles from '../styles/NavBar.module.css';

function NavBar() {
  const navigate = useNavigate();

  return (
    <div id="navDiv" className={styles.navContainer}>
      
      <button className={styles.btn} onClick={() => navigate('/login')}>Log In</button>
      <button className={styles.btn2} onClick={() => navigate('/register')}>Sign Up</button>
    </div>
  );
}

export default NavBar;
