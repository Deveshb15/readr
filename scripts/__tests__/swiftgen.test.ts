import { colors, fonts } from '../../src/design/tokens';
import { UnsupportedPathError } from '../../src/design/doodles/pathParser';
import { parseColor, renderDoodlesSwift, renderThemeSwift } from '../lib/swiftgen';

describe('renderThemeSwift', () => {
  const swift = renderThemeSwift(colors, fonts);

  it('emits every colour token with its source value', () => {
    for (const [name, value] of Object.entries(colors)) {
      expect(swift).toContain(`static let ${name} = Color(`);
      expect(swift).toContain(`// ${value}`);
    }
  });

  it('converts ink hex to sRGB components', () => {
    expect(swift).toContain('static let ink = Color(.sRGB, red: 0.094, green: 0, blue: 0.8, opacity: 1)');
  });

  it('emits font helpers by PostScript name', () => {
    expect(swift).toContain('static func serifItalic(_ size: CGFloat) -> Font { .custom("InstrumentSerif-Italic"');
  });
});

describe('parseColor', () => {
  it('parses rgba', () => {
    expect(parseColor('rgba(24,0,204,0.35)')).toEqual({ r: 24, g: 0, b: 204, a: 0.35 });
  });
  it('rejects named colours', () => {
    expect(() => parseColor('red')).toThrow('Unsupported color');
  });
});

describe('renderDoodlesSwift', () => {
  it('turns M/L/C/Q/Z into SwiftUI Path builder calls', () => {
    const swift = renderDoodlesSwift({
      viewBox: 32,
      doodles: [{ name: 'test', paths: ['M1 2 L3 4 C5 6 7 8 9 10 Q11 12 13 14 Z'] }],
    });
    expect(swift).toContain('p.move(to: CGPoint(x: 1, y: 2))');
    expect(swift).toContain('p.addLine(to: CGPoint(x: 3, y: 4))');
    expect(swift).toContain(
      'p.addCurve(to: CGPoint(x: 9, y: 10), control1: CGPoint(x: 5, y: 6), control2: CGPoint(x: 7, y: 8))',
    );
    expect(swift).toContain('p.addQuadCurve(to: CGPoint(x: 13, y: 14), control: CGPoint(x: 11, y: 12))');
    expect(swift).toContain('p.closeSubpath()');
    expect(swift).toContain('static let names: [String] = ["test"]');
  });

  it('fails the build on unsupported commands, naming the path', () => {
    expect(() =>
      renderDoodlesSwift({ viewBox: 32, doodles: [{ name: 'arc', paths: ['M1 1 A2 2 0 0 1 3 3'] }] }),
    ).toThrow(UnsupportedPathError);
  });
});
