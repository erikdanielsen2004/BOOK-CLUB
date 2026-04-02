import PageTitle from '../components/PageTitle';
import NavBar from '../components/NavBar';
import styles from '../styles/LoginPage.module.css';
import BookThumbnail from '../components/BookThumbnail';


const LoginPage = () =>
{

    return(
        <div className={styles.wrapper}>
           <NavBar />

           <main className={styles.wrapper2}>
            <PageTitle />
            <BookThumbnail />
           </main>
      </div>
    );
};

export default LoginPage;
