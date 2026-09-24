import Foundation

/// Decoded result of src/extract/extract.ts (shared by Safari preprocessing and WebExtractor).
struct ExtractedImage: Codable {
  let index: Int
  let src: String
  let file: String
  let width: Int?
  let height: Int?
}

struct Extraction: Decodable {
  let ok: Bool
  let url: String
  let canonical: String?
  let reason: String?
  let title: String?
  let byline: String?
  let siteName: String?
  let excerpt: String?
  let lang: String?
  let html: String?
  let images: [ExtractedImage]?
  let leadImage: String?
  let wordCount: Int?
  let minutes: Int?

  static func decode(_ json: String) -> Extraction? {
    guard let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Extraction.self, from: data)
  }
}
