import NavBar from '../components/NavBar.tsx';
import styles from '../styles/LoginPage.module.css';
import BookThumbnail from '../components/BookThumbnail.tsx';

const LoginPage = () => {
    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <NavBar />

                <main className={styles.heroContent}>
                    <div className={styles.textBlock}>
                        <h1 className={styles.title}>
                            Welcome
                            <br />
                            to the
                            <br />
                            Book
                            <br />
                            Club
                        </h1>
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
