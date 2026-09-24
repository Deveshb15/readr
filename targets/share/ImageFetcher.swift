import Foundation
import ImageIO
import UniformTypeIdentifiers

/// Streams article images to disk under a hard wall-clock budget. Never decodes
/// full-size images (memory budget P2); the thumbnail uses ImageIO downsampling.
enum ImageFetcher {
  static let maxConcurrent = 6
  static let thumbMaxPixels = 168  // 56pt @3x

  private static let session: URLSession = {
    let config = URLSessionConfiguration.ephemeral
    config.timeoutIntervalForRequest = 2
    config.httpMaximumConnectionsPerHost = maxConcurrent
    config.urlCache = nil
    return URLSession(configuration: config)
  }()

  /// Returns the indexes that finished before `deadline`.
  static func fetch(_ images: [MetaImage], into dir: URL, deadline: Date) async -> Set<Int> {
    guard !images.isEmpty else { return [] }
    return await withTaskGroup(of: Int?.self) { group in
      var done = Set<Int>()
      var iterator = images.makeIterator()
      var inFlight = 0

      func addNext() -> Bool {
        guard let image = iterator.next() else { return false }
        group.addTask { await download(image, into: dir, deadline: deadline) ? image.index : nil }
        return true
      }

      while inFlight < maxConcurrent, addNext() { inFlight += 1 }
      for await result in group {
        if let index = result { done.insert(index) }
        if Date() < deadline, addNext() { continue }
      }
      return done
    }
  }

  private static func download(_ image: MetaImage, into dir: URL, deadline: Date) async -> Bool {
    guard let url = URL(string: image.src) else { return false }
    let remaining = deadline.timeIntervalSinceNow
    guard remaining > 0.05 else { return false }
    let task = Task { try await session.download(from: url) }
    let timer = Task {
      try? await Task.sleep(nanoseconds: UInt64(remaining * 1_000_000_000))
      task.cancel()
    }
    defer { timer.cancel() }
    guard
      let (tmp, response) = try? await task.value,
      let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode)
    else { return false }
    let dest = dir.appendingPathComponent(image.file)
    try? FileManager.default.removeItem(at: dest)
    return (try? FileManager.default.moveItem(at: tmp, to: dest)) != nil
  }

  /// Downsampled JPEG thumbnail from a local file.
  static func makeThumbnail(from source: URL, to dest: URL) -> Bool {
    guard let src = CGImageSourceCreateWithURL(source as CFURL, [kCGImageSourceShouldCache: false] as CFDictionary) else {
      return false
    }
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: thumbMaxPixels,
    ]
    guard
      let thumb = CGImageSourceCreateThumbnailAtIndex(src, 0, options as CFDictionary),
      let out = CGImageDestinationCreateWithURL(dest as CFURL, UTType.jpeg.identifier as CFString, 1, nil)
    else { return false }
    CGImageDestinationAddImage(out, thumb, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
    return CGImageDestinationFinalize(out)
  }

  /// Lead image that isn't inline (og:image): download just for the thumbnail.
  static func fetchLeadOnly(_ src: String, into dir: URL, deadline: Date) async -> URL? {
    let image = MetaImage(index: -1, src: src, file: "lead.tmp", width: nil, height: nil, done: false)
    guard await download(image, into: dir, deadline: deadline) else { return nil }
    return dir.appendingPathComponent("lead.tmp")
  }
}
