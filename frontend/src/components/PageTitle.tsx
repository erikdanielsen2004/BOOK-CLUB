import styles from '../styles/PageTitle.module.css';

function PageTitle()
{
   return(
          <h1 id="title" className={styles.titleContainer}>
            Welcome to the Book Club
          </h1>
   );
};

export default PageTitle;
