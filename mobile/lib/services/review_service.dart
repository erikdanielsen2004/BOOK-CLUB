import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/book.dart';
import '../models/review.dart';

class ReviewBookSummary {
  final String id;
  final String title;
  final List<String> authors;
  final String thumbnail;
  final double averageRatingDb;
  final int reviewCount;

  ReviewBookSummary({
    required this.id,
    required this.title,
    required this.authors,
    required this.thumbnail,
    required this.averageRatingDb,
    required this.reviewCount,
  });

  factory ReviewBookSummary.fromJson(Map<String, dynamic> json) {
    return ReviewBookSummary(
      id: (json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      authors: List<String>.from(json['authors'] ?? []),
      thumbnail: (json['thumbnail'] ?? '').toString(),
      averageRatingDb: (json['averageRatingDb'] ?? 0).toDouble(),
      reviewCount: (json['reviewCount'] ?? 0) is int
          ? (json['reviewCount'] ?? 0)
          : int.tryParse('${json['reviewCount']}') ?? 0,
    );
  }
}

class ReviewViewResponse {
  final BookModel book;
  final double averageRating;
  final int reviewCount;
  final List<ReviewModel> reviews;
  final int page;
  final int totalPages;

  ReviewViewResponse({
    required this.book,
    required this.averageRating,
    required this.reviewCount,
    required this.reviews,
    required this.page,
    required this.totalPages,
  });
}

class ReviewService {
  Future<List<ReviewBookSummary>> searchReviewedBooks({String query = ''}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/book-reviews/search-books')
        .replace(queryParameters: query.trim().isNotEmpty ? {'q': query.trim()} : null);

    final response = await http.get(
      uri,
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(data['books'] ?? [])
          .map((b) => ReviewBookSummary.fromJson(b))
          .toList();
    } else {
      throw Exception(data['message'] ?? 'Could not search reviewed books.');
    }
  }

  Future<List<BookModel>> getUserHasReadBooks(String userId, {String query = ''}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/book-reviews/user-hasread/$userId')
        .replace(queryParameters: query.trim().isNotEmpty ? {'q': query.trim()} : null);

    final response = await http.get(
      uri,
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(data['books'] ?? [])
          .map((b) => BookModel.fromJson(b))
          .toList();
    } else {
      throw Exception(data['message'] ?? 'Could not load your Has Read books.');
    }
  }

  Future<ReviewViewResponse> viewBookReviews({
    required String bookId,
    String sort = 'newest',
    int page = 1,
    int limit = 5,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/book-reviews/view/$bookId').replace(
      queryParameters: {
        'sort': sort,
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );

    final response = await http.get(
      uri,
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return ReviewViewResponse(
        book: BookModel.fromJson(Map<String, dynamic>.from(data['book'] ?? {})),
        averageRating: (data['averageRating'] ?? 0).toDouble(),
        reviewCount: (data['reviewCount'] ?? 0) is int
            ? (data['reviewCount'] ?? 0)
            : int.tryParse('${data['reviewCount']}') ?? 0,
        reviews: List<Map<String, dynamic>>.from(data['reviews'] ?? [])
            .map((r) => ReviewModel.fromJson(r))
            .toList(),
        page: (data['page'] ?? 1) is int ? data['page'] : int.tryParse('${data['page']}') ?? 1,
        totalPages: (data['totalPages'] ?? 1) is int
            ? data['totalPages']
            : int.tryParse('${data['totalPages']}') ?? 1,
      );
    } else {
      throw Exception(data['message'] ?? 'Could not load reviews.');
    }
  }

  Future<String> createReview({
    required String bookId,
    required String userId,
    required double rating,
    required String reviewText,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/book-reviews/create/$bookId/$userId'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'rating': rating,
        'reviewText': reviewText,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 201) {
      return data['message'] ?? 'Review created successfully.';
    } else {
      throw Exception(data['message'] ?? 'Could not create review.');
    }
  }

  Future<String> deleteReview({
    required String userId,
    required String reviewId,
  }) async {
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/api/book-reviews/delete/$userId/$reviewId'),
      headers: {
        'Accept': 'application/json',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data['message'] ?? 'Review deleted successfully.';
    } else {
      throw Exception(data['message'] ?? 'Could not delete review.');
    }
  }
}