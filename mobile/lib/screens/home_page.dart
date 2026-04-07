import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/book.dart';
import '../services/user_books_service.dart';

class HomePage extends StatefulWidget {
  final UserModel user;

  const HomePage({super.key, required this.user});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _booksService = UserBooksService();

  bool _isLoading = true;
  String _error = '';

  List<BookModel> hasRead = [];
  List<BookModel> reading = [];
  List<BookModel> wantsToRead = [];

  @override
  void initState() {
    super.initState();
    _loadBooks();
  }

  Future<void> _loadBooks() async {
    try {
      final data = await _booksService.getUserBooks(widget.user.id);

      setState(() {
        hasRead = data['hasRead'] ?? [];
        reading = data['reading'] ?? [];
        wantsToRead = data['wantsToRead'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Widget _buildBookSection(String title, List<BookModel> books) {
    return ExpansionTile(
      title: Text('$title (${books.length})'),
      children: books
          .map(
            (book) => ListTile(
              title: Text(book.title),
              subtitle: Text(book.authors.join(', ')),
            ),
          )
          .toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome, ${widget.user.firstName}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : ListView(
                  children: [
                    _buildBookSection('Has Read', hasRead),
                    _buildBookSection('Reading', reading),
                    _buildBookSection('Wants To Read', wantsToRead),
                  ],
                ),
    );
  }
}