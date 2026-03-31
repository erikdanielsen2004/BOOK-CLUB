import PageTitle from '../components/PageTitle.tsx';
import NavBar from '../components/NavBar.tsx';
import styles from './LoginPage.module.css';
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
