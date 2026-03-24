import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import BookUI from '../components/BookUI';

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