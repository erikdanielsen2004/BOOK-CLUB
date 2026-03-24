function BookUI()
{
    
    function addBook(event:any) : void
    {
        event.preventDefault();
        alert('addBook()');

    };

    function searchBook(event:any) : void
    {
        event.preventDefault();
        alert('searchBook');
    };

    return(
      <div id="bookUIDiv">
       <br />
       <input type="text" id="searchText" placeholder="Book To Search For" />
       <button type="button" id="searchBookButton" className="buttons" 
           onClick={searchBook}> Search Book </button><br />
       <span id="bookSearchResult"></span>
       <p id="bookList"></p><br /><br />
       <input type="text" id="bookText" placeholder="Book To Add" />
       <button type="button" id="addBookButton" className="buttons" 
          onClick={addBook}> Add Book </button><br />
       <span id="bookAddResult"></span>
     </div>
    );
}

export default BookUI;