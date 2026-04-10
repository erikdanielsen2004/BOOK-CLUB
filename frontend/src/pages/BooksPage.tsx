import Sidebar from "../components/Sidebar.tsx";
import BookUI from "../components/BookUI.tsx";
import "../styles/Books.css";

const BooksPage = () => {
  return (
    <div className="books-layout">
      <Sidebar />
      <div className="books-main">
        <h1 className="books-heading">Books</h1>
        <BookUI />
      </div>
    </div>
  );
};

export default BooksPage;
