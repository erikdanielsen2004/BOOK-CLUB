import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/book.dart';

class UserBooksService {
  Future<Map<String, List<BookModel>>> getUserBooks(String userId) async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/user-books/$userId'),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return {
        'hasRead': List<Map<String, dynamic>>.from(data['hasRead'])
            .map((b) => BookModel.fromJson(b))
            .toList(),
        'reading': List<Map<String, dynamic>>.from(data['reading'])
            .map((b) => BookModel.fromJson(b))
            .toList(),
        'wantsToRead': List<Map<String, dynamic>>.from(data['wantsToRead'])
            .map((b) => BookModel.fromJson(b))
            .toList(),
      };
    } else {
      throw Exception(data['error'] ?? 'Failed to load books');
    }
  }
}