import NavBar from '../components/NavBar.tsx';
import styles from '../styles/LoginPage.module.css';
import BookThumbnail from '../components/BookThumbnail.tsx';
import PageTitle from '../components/PageTitle.tsx';

const LoginPage = () => {
    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                
                <main className={styles.heroContent}>
                    <div>
                        <PageTitle />
                    </div>
                    <div>
                        <NavBar />
                    </div>
                    <div className={styles.booksBlock}>
                            <BookThumbnail />
                    </div>

                </main>
            
               
            
            </section>

            <section className={styles.bottomSection}>
                <p className={styles.bottomText}>
                    Read, rate, and review books with other readers online!
                </p>
            </section>
        </div>
    );
};

export default LoginPage;
