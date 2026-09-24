import SwiftUI

/// The save card (design system: SaveCard). one year compose card + TiltedCard:
/// doodle draws on, title in Instrument Serif Italic, mono meta, status chip, undo.
struct SaveCardView: View {
  @ObservedObject var coordinator: SaveCoordinator
  @State private var appeared = false
  @State private var drawn: CGFloat = 0
  @State private var shake: CGFloat = 0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    let card = coordinator.card
    VStack {
      Spacer()
      VStack(alignment: .leading, spacing: 14) {
        HStack(alignment: .center, spacing: 10) {
          DoodleView(index: card.doodle ?? 0, progress: card.doodle == nil ? 0 : drawn)
            .frame(width: 32, height: 32)
          Text(card.host.lowercased())
            .font(ReadrFont.mono(13))
            .foregroundStyle(ReadrColor.textMuted)
            .lineLimit(1)
          Spacer()
          StatusChip(outcome: card.outcome)
            .offset(x: shake)
        }
        Text(card.title ?? " ")
          .font(ReadrFont.serifItalic(26))
          .foregroundStyle(ReadrColor.text)
          .lineLimit(3)
          .redacted(reason: card.title == nil ? .placeholder : [])
        HStack {
          Text(card.meta ?? "")
            .font(ReadrFont.mono(13))
            .foregroundStyle(ReadrColor.textMuted)
          Spacer()
          if card.outcome == .saved || card.outcome == .linkOnly {
            Button("undo") { coordinator.undo() }
              .font(ReadrFont.mono(13))
              .foregroundStyle(ReadrColor.textMuted)
              .frame(minHeight: 44)
          } else if card.outcome == .alreadySaved || card.outcome == .failed {
            Button("close") { coordinator.close() }
              .font(ReadrFont.mono(13))
              .foregroundStyle(ReadrColor.textMuted)
              .frame(minHeight: 44)
          }
        }
      }
      .padding(20)
      .background(
        RoundedRectangle(cornerRadius: 24, style: .continuous)
          .fill(ReadrColor.surfaceSolid)
          .shadow(color: Color(red: 0.08, green: 0.04, blue: 0.31).opacity(0.12), radius: 16, y: 12)
      )
      .rotationEffect(.degrees(reduceMotion ? 0 : (appeared ? -2 : -4)))
      .offset(y: appeared || reduceMotion ? 0 : 24)
      .opacity(appeared ? 1 : 0)
      .padding(.horizontal, 20)
      .padding(.bottom, 28)
    }
    .background(Color.black.opacity(appeared ? 0.18 : 0).ignoresSafeArea())
    .preferredColorScheme(.light)
    .onAppear {
      withAnimation(.spring(response: 0.42, dampingFraction: 0.72)) { appeared = true }
    }
    .onChange(of: card.doodle) { _, _ in
      withAnimation(reduceMotion ? nil : .easeOut(duration: 0.6)) { drawn = 1 }
    }
    .onChange(of: card.outcome) { _, outcome in
      guard outcome == .alreadySaved, !reduceMotion else { return }
      withAnimation(.spring(response: 0.12, dampingFraction: 0.2)) { shake = 4 }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
        withAnimation(.spring(response: 0.2, dampingFraction: 0.5)) { shake = 0 }
      }
    }
    .accessibilityElement(children: .contain)
  }
}

private struct StatusChip: View {
  let outcome: SaveOutcome

  var body: some View {
    let (label, filled): (String, Bool) = {
      switch outcome {
      case .preparing: return ("saving…", false)
      case .saved: return ("saved for later", true)
      case .alreadySaved: return ("already saved", true)
      case .linkOnly: return ("saved link", false)
      case .failed: return ("couldn't save", false)
      }
    }()
    Text(label)
      .font(ReadrFont.mono(11))
      .foregroundStyle(filled ? Color.white : ReadrColor.ink)
      .padding(.vertical, 6)
      .padding(.horizontal, 10)
      .background(RoundedRectangle(cornerRadius: 8).fill(filled ? ReadrColor.ink : ReadrColor.inkWash))
      .contentTransition(.opacity)
      .animation(.easeOut(duration: 0.18), value: label)
      .accessibilityLabel(label)
  }
}

/// Draws a generated doodle; `progress` trims each stroke for the draw-on effect.
struct DoodleView: View {
  let index: Int
  var progress: CGFloat = 1

  var body: some View {
    GeometryReader { geo in
      let paths = Doodles.all[((index % Doodles.all.count) + Doodles.all.count) % Doodles.all.count]
      let scale = min(geo.size.width, geo.size.height) / Doodles.viewBox
      ZStack {
        ForEach(paths.indices, id: \.self) { i in
          paths[i]
            .trim(from: 0, to: progress)
            .applying(CGAffineTransform(scaleX: scale, y: scale))
            .stroke(ReadrColor.ink, style: StrokeStyle(lineWidth: 1.75, lineCap: .round, lineJoin: .round))
        }
      }
    }
    .accessibilityHidden(true)
  }
}
