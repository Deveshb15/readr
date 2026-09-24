import Foundation
import JavaScriptCore

/// Runs the shared TS core (generated/core.js) in a bare JSContext so canonical URL,
/// article id and doodle match the app exactly. Created lazily; a few MB at most.
struct Identity: Decodable {
  let ok: Bool
  let canonicalUrl: String?
  let id: String?
  let doodle: Int?
  let isPractice: Bool?
  let reason: String?
}

final class CoreJS {
  private lazy var context: JSContext? = {
    guard
      let url = Bundle(for: CoreJS.self).url(forResource: "core", withExtension: "js"),
      let source = try? String(contentsOf: url, encoding: .utf8),
      let ctx = JSContext()
    else { return nil }
    ctx.evaluateScript(source)
    return ctx
  }()

  func identify(_ input: String, canonicalHint: String?) -> Identity? {
    guard
      let fn = context?.objectForKeyedSubscript("ReadrCore")?.objectForKeyedSubscript("identifyJSON"),
      let json = fn.call(withArguments: [input, canonicalHint ?? NSNull()])?.toString(),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(Identity.self, from: data)
  }
}
