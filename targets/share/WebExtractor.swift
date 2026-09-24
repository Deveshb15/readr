import Foundation
import WebKit

/// URL-only shares (Chrome, X, Messages…): fetch HTML, load it into an off-screen
/// web view with page JavaScript and subresources disabled, then run extract.js in
/// an isolated content world. The WebContent process holds the DOM, not the extension.
@MainActor
final class WebExtractor: NSObject, WKNavigationDelegate {
  static let fetchTimeout: TimeInterval = 4

  private var webView: WKWebView?
  private var navigation: CheckedContinuation<Void, Error>?

  func extract(url: URL) async -> Extraction? {
    guard let html = await fetchHTML(url), let source = Self.extractSource else { return nil }
    defer { teardown() }
    do {
      let web = try await makeWebView()
      webView = web
      try await withCheckedThrowingContinuation { (c: CheckedContinuation<Void, Error>) in
        navigation = c
        web.loadHTMLString(html, baseURL: url)
      }
      let result = try await web.callAsyncJavaScript(
        source + "\nreturn ReadrExtract.run(pageUrl);",
        arguments: ["pageUrl": url.absoluteString],
        in: nil,
        contentWorld: .defaultClient
      )
      return (result as? String).flatMap(Extraction.decode)
    } catch {
      return nil
    }
  }

  private func fetchHTML(_ url: URL) async -> String? {
    var request = URLRequest(url: url, timeoutInterval: Self.fetchTimeout)
    request.setValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      forHTTPHeaderField: "User-Agent"
    )
    guard
      let (data, response) = try? await URLSession.shared.data(for: request),
      let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
      (http.mimeType ?? "text/html").contains("html")
    else { return nil }
    return String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1)
  }

  private func makeWebView() async throws -> WKWebView {
    let config = WKWebViewConfiguration()
    config.websiteDataStore = .nonPersistent()
    config.defaultWebpagePreferences.allowsContentJavaScript = false
    // Block every subresource: extraction only needs the DOM, not images or CSS.
    let rules = """
    [{"trigger":{"url-filter":".*","resource-type":["image","style-sheet","script","font","media","raw","svg-document","popup"]},"action":{"type":"block"}}]
    """
    if let list = try await WKContentRuleListStore.default().compileContentRuleList(
      forIdentifier: "readr-block-all", encodedContentRuleList: rules)
    {
      config.userContentController.add(list)
    }
    let web = WKWebView(frame: .zero, configuration: config)
    web.navigationDelegate = self
    return web
  }

  private func teardown() {
    webView?.navigationDelegate = nil
    webView?.stopLoading()
    webView = nil
  }

  nonisolated func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    Task { @MainActor in self.navigation?.resume(); self.navigation = nil }
  }

  nonisolated func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    Task { @MainActor in self.navigation?.resume(throwing: error); self.navigation = nil }
  }

  nonisolated func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    Task { @MainActor in self.navigation?.resume(throwing: error); self.navigation = nil }
  }

  private static let extractSource: String? = {
    guard let url = Bundle(for: WebExtractor.self).url(forResource: "extract", withExtension: "js") else { return nil }
    return try? String(contentsOf: url, encoding: .utf8)
  }()
}
