import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/book.dart';
import '../models/group.dart';

class GroupService {
  Map<String, String> get _jsonHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  Future<List<GroupModel>> getMyGroups(String userId, {String search = ''}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/group-main/search/$userId')
        .replace(queryParameters: search.trim().isNotEmpty ? {'searchBar': search.trim()} : null);

    final response = await http.get(uri, headers: {'Accept': 'application/json'});
    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(data['groups'] ?? [])
          .map((g) => GroupModel.fromJson(g))
          .toList();
    } else {
      throw Exception(data['message'] ?? 'Failed to load groups.');
    }
  }

  Future<List<GroupModel>> getDiscoverGroups({String search = ''}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/group-main/search')
        .replace(queryParameters: search.trim().isNotEmpty ? {'searchBar': search.trim()} : null);

    final response = await http.get(uri, headers: {'Accept': 'application/json'});
    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(data['groups'] ?? [])
          .map((g) => GroupModel.fromJson(g))
          .toList();
    } else {
      throw Exception(data['message'] ?? 'Failed to load groups.');
    }
  }

  Future<GroupModel> createGroup({
    required String userId,
    required String name,
    required String description,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-main/create/$userId'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'name': name,
        'description': description,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 201) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to create group.');
    }
  }

  Future<void> joinGroup({
    required String userId,
    required String groupId,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-main/join/$userId/$groupId'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to join group.');
    }
  }

  Future<GroupModel> editGroup({
    required String userId,
    required String groupId,
    required String name,
    required String description,
  }) async {
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/api/group-main/edit/$userId/$groupId'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'name': name,
        'description': description,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to update group.');
    }
  }

  Future<void> leaveGroup({
    required String userId,
    required String groupId,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-main/leave/$userId/$groupId'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to leave group.');
    }
  }

  Future<void> deleteGroup({
    required String userId,
    required String groupId,
  }) async {
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/api/group-main/delete/$userId/$groupId'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to delete group.');
    }
  }

  Future<List<BookModel>> searchBooks({
    required String query,
    int maxResults = 10,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/search/books').replace(
      queryParameters: {
        'q': query.trim(),
        'maxResults': maxResults.toString(),
      },
    );

    final response = await http.get(uri, headers: {'Accept': 'application/json'});
    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(data['books'] ?? [])
          .map((b) => BookModel.fromJson(b))
          .toList();
    } else {
      throw Exception(data['message'] ?? 'Search failed.');
    }
  }

  Future<GroupModel> addCandidateBook({
    required String userId,
    required String groupId,
    required BookModel book,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-owner/add-to-list/$userId/$groupId'),
      headers: _jsonHeaders,
      body: jsonEncode(book.toJson()),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to add book.');
    }
  }

  Future<GroupModel> removeCandidateBook({
    required String userId,
    required String groupId,
    required String bookId,
  }) async {
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/api/group-owner/remove-from-list/$userId/$groupId/$bookId'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to remove book.');
    }
  }

  Future<GroupModel> publishList({
    required String userId,
    required String groupId,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-owner/$userId/$groupId/publish-list'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to publish list.');
    }
  }

  Future<GroupModel> startVote({
    required String userId,
    required String groupId,
    required int durationDays,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-owner/start-vote/$userId/$groupId'),
      headers: _jsonHeaders,
      body: jsonEncode({'durationDays': durationDays}),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to start vote.');
    }
  }

  Future<GroupModel> castVote({
    required String userId,
    required String groupId,
    required String bookId,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-voting/cast-vote/$userId/$groupId/$bookId'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to cast vote.');
    }
  }

  Future<GroupModel> endVote({
    required String userId,
    required String groupId,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/group-voting/vote-ended/$userId/$groupId'),
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return GroupModel.fromJson(data['group']);
    } else {
      throw Exception(data['message'] ?? 'Failed to end vote.');
    }
  }
}