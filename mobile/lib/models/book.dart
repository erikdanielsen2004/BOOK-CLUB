class BookModel {
  final String id;
  final String googleBooksId;
  final String title;
  final List<String> authors;
  final String description;
  final List<String> categories;
  final String thumbnail;
  final int pageCount;
  final String publishedDate;
  final double averageRating;
  final int ratingsCount;

  BookModel({
    required this.id,
    required this.googleBooksId,
    required this.title,
    required this.authors,
    required this.description,
    required this.categories,
    required this.thumbnail,
    required this.pageCount,
    required this.publishedDate,
    required this.averageRating,
    required this.ratingsCount,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) {
    return BookModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      googleBooksId: (json['googleBooksId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      authors: List<String>.from(json['authors'] ?? []),
      description: (json['description'] ?? '').toString(),
      categories: List<String>.from(json['categories'] ?? []),
      thumbnail: (json['thumbnail'] ?? '').toString(),
      pageCount: (json['pageCount'] ?? 0) is int
          ? (json['pageCount'] ?? 0)
          : int.tryParse('${json['pageCount']}') ?? 0,
      publishedDate: (json['publishedDate'] ?? '').toString(),
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      ratingsCount: (json['ratingsCount'] ?? 0) is int
          ? (json['ratingsCount'] ?? 0)
          : int.tryParse('${json['ratingsCount']}') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'googleBooksId': googleBooksId,
      'title': title,
      'authors': authors,
      'description': description,
      'categories': categories,
      'thumbnail': thumbnail,
      'pageCount': pageCount,
      'publishedDate': publishedDate,
      'averageRating': averageRating,
      'ratingsCount': ratingsCount,
    };
  }
}