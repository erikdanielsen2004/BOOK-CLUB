import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/book.dart';

class UserBooksService {
  Future<Map<String, List<BookModel>>> getUserBooks(String userId) async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/user-books/$userId'),
      headers: {
        'Accept': 'application/json',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return {
        'hasRead': List<Map<String, dynamic>>.from(data['hasRead'] ?? [])
            .map((b) => BookModel.fromJson(b))
            .toList(),
        'reading': List<Map<String, dynamic>>.from(data['reading'] ?? [])
            .map((b) => BookModel.fromJson(b))
            .toList(),
        'wantsToRead': List<Map<String, dynamic>>.from(data['wantsToRead'] ?? [])
            .map((b) => BookModel.fromJson(b))
            .toList(),
      };
    } else {
      throw Exception(data['message'] ?? 'Failed to load books');
    }
  }

  Future<List<BookModel>> searchBooks({
    String query = '',
    String category = '',
    int startIndex = 0,
    int maxResults = 12,
  }) async {
    final params = <String, String>{};

    if (query.trim().isNotEmpty) {
      params['q'] = query.trim();
    }
    if (category.trim().isNotEmpty) {
      params['category'] = category.trim();
    }

    params['startIndex'] = startIndex.toString();
    params['maxResults'] = maxResults.toString();

    final uri = Uri.parse('${ApiConfig.baseUrl}/api/search/books')
        .replace(queryParameters: params);

    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(data['books'] ?? [])
          .map((b) => BookModel.fromJson(b))
          .toList();
    } else {
      throw Exception(data['message'] ?? 'Search failed');
    }
  }

  Future<String> addBookToList({
    required String userId,
    required String list,
    required BookModel book,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/user-books/$userId/$list'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(book.toJson()),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data['message'] ?? 'Book added successfully.';
    } else {
      throw Exception(data['message'] ?? 'Could not add book.');
    }
  }

  Future<String> moveBook({
    required String userId,
    required String bookId,
    required String to,
  }) async {
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/api/user-books/$userId/move'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'to': to,
        'bookId': bookId,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data['message'] ?? 'Book moved successfully.';
    } else {
      throw Exception(data['message'] ?? 'Could not move book.');
    }
  }

  Future<String> removeBook({
    required String userId,
    required String list,
    required String bookId,
  }) async {
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/api/user-books/$userId/$list/$bookId'),
      headers: {
        'Accept': 'application/json',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data['message'] ?? 'Book removed successfully.';
    } else {
      throw Exception(data['message'] ?? 'Could not remove book.');
    }
  }
}