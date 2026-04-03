import PageTitle from '../components/PageTitle.tsx';
import LoggedInName from '../components/LoggedInName.tsx';
import BookUI from '../components/BookUI.tsx';

const BooksPage = () =>
{
    return(
        <div>
            <PageTitle />
            <LoggedInName />
            <BookUI />
        </div>
    );
}

export default BooksPage;
