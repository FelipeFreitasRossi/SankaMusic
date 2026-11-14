"""Gera as ILUSTRAÇÕES DE DEMONSTRAÇÃO (SVG) usadas pelos produtos fictícios.

Saída: ../frontend/public/demo/
    products/{tipo}-{cor}-{1,2,3}.svg   (3 vistas por produto: frente, ângulo escuro, detalhe)
    categories/{slug}.svg
    banners/hero-*.svg

Uso (na pasta backend):  python -m scripts.generate_demo_images
Não usa nenhuma dependência externa. São ilustrações vetoriais genéricas,
sem marcas reais — substitua por fotos reais dos produtos em produção.
"""
from pathlib import Path

from scripts.demo_data import CATEGORIES, image_combos

OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "demo"

PALETTES = {
    "sunburst": ("#F6C14B", "#C9581A", "#2B1408"),
    "black": ("#4A4A4A", "#1C1C1C", "#050505"),
    "orange": ("#FFB061", "#FF6A00", "#9E3F00"),
    "white": ("#FFFFFF", "#ECECEC", "#BDBDBD"),
    "natural": ("#F3D7A5", "#D5A564", "#9C6A2E"),
    "amber": ("#F0B86A", "#C47A2C", "#7A4314"),
    "mahogany": ("#A65A33", "#6E3219", "#331509"),
    "teal": ("#4FB3B0", "#1F7473", "#0B3534"),
    "wine": ("#B8364A", "#7D1626", "#3A0710"),
    "silver": ("#F4F5F7", "#C3C7CC", "#7D838A"),
    "cream": ("#FBF1DC", "#E2CFA6", "#A8925F"),
}


def defs(c) -> str:
    c1, c2, c3 = c
    return f"""
<radialGradient id="body" cx="42%" cy="38%" r="75%"><stop offset="0" stop-color="{c1}"/><stop offset=".55" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></radialGradient>
<linearGradient id="bodyL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset=".5" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDFDFD"/><stop offset=".45" stop-color="#B9BEC4"/><stop offset=".7" stop-color="#E9ECEF"/><stop offset="1" stop-color="#868B91"/></linearGradient>
<linearGradient id="maple" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9AE6B"/><stop offset=".5" stop-color="#F2D29C"/><stop offset="1" stop-color="#C99A55"/></linearGradient>
<linearGradient id="board" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A1A10"/><stop offset=".5" stop-color="#4A2E1C"/><stop offset="1" stop-color="#22140B"/></linearGradient>
<radialGradient id="cymbal" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#D9A53A"/><stop offset="1" stop-color="#8A5E14"/></radialGradient>
<radialGradient id="cone" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#4A4A4A"/><stop offset=".7" stop-color="#1A1A1A"/><stop offset="1" stop-color="#000"/></radialGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<pattern id="mesh" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#2a2a2a"/><path d="M0 0L10 10M10 0L0 10" stroke="#777" stroke-width="1.2"/></pattern>
<pattern id="cloth" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#2b2620"/><path d="M0 6h12M6 0v12" stroke="#4a4136" stroke-width="2"/></pattern>
<pattern id="grille" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#151515"/><circle cx="4.5" cy="4.5" r="2" fill="#2e2e2e"/></pattern>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".28"/></filter>
"""


# ----------------------------------------------------------------- instrumentos
GUITAR_BODY = ("M400,740 C300,740 245,700 250,630 C254,580 290,560 288,525 C286,490 250,470 262,430 "
               "C272,398 305,392 320,420 C330,440 345,452 370,452 L430,452 C455,452 468,436 478,410 "
               "C490,378 530,380 540,420 C548,455 512,490 512,525 C512,560 552,585 552,635 "
               "C552,705 500,740 400,740 Z")


def _frets(x, w, top, bottom, n=21):
    out, y, step = [], top, (bottom - top) / 13.5
    for i in range(n):
        y += step
        step *= 0.945
        if y > bottom:
            break
        out.append(f'<line x1="{x}" y1="{y:.1f}" x2="{x + w}" y2="{y:.1f}" stroke="#D7DBDF" stroke-width="2"/>')
        if i in (2, 4, 6, 8, 11):
            out.append(f'<circle cx="{x + w / 2}" cy="{y + step * 0.55:.1f}" r="3.2" fill="#EDE3D0"/>')
    return "".join(out)


def electric(c, bass=False):
    guard = "#111" if c[1] not in ("#1C1C1C",) else "#F4F4F4"
    strings = 4 if bass else 6
    neck_top = 40 if bass else 150
    sx = [392 + i * (16 / (strings - 1)) for i in range(strings)]
    pickups = ([(372, 540, 56), (372, 610, 56)] if bass else [(374, 505, 52), (374, 565, 52), (374, 625, 52)])
    tuners = "".join(
        f'<circle cx="{446 + (6 if bass else 0)}" cy="{neck_top + 22 + i * (18 if not bass else 24)}" r="{9 if bass else 7}" fill="url(#metal)" stroke="#555" stroke-width="1"/>'
        for i in range(strings)
    )
    head = (f'<path d="M384,{neck_top + 110} L384,{neck_top + 40} C384,{neck_top + 12} 398,{neck_top - 6} 424,{neck_top - 8} '
            f'C448,{neck_top - 10} 456,{neck_top + 6} 442,{neck_top + 20} C434,{neck_top + 30} 430,{neck_top + 44} 430,{neck_top + 60} '
            f'L430,{neck_top + 110} Z" fill="url(#maple)" stroke="#8a6334" stroke-width="1.5"/>')
    return f"""
<g filter="url(#soft)">
 <path d="{GUITAR_BODY}" fill="url(#body)"/>
 <path d="{GUITAR_BODY}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
 <path d="M300,500 C330,470 360,470 372,470 L430,470 C455,470 470,500 470,540 C470,600 520,620 500,670 C480,720 330,720 302,680 C280,650 312,610 312,575 C312,540 286,520 300,500 Z" fill="{guard}" opacity=".92"/>
 <rect x="384" y="{neck_top + 100}" width="32" height="{470 - neck_top - 100}" rx="4" fill="url(#maple)"/>
 <rect x="388" y="{neck_top + 112}" width="24" height="{460 - neck_top - 112}" fill="url(#board)"/>
 {_frets(388, 24, neck_top + 112, 460)}
 {head}{tuners}
 <rect x="386" y="{neck_top + 108}" width="28" height="5" fill="#F4EEDC"/>
 {"".join(f'<rect x="{x}" y="{y}" width="{w}" height="16" rx="5" fill="#141414" stroke="#3a3a3a"/>' + "".join(f'<circle cx="{x + 8 + k * ((w - 16) / 5)}" cy="{y + 8}" r="2.4" fill="#9a9a9a"/>' for k in range(6)) for x, y, w in pickups)}
 <rect x="370" y="670" width="60" height="22" rx="4" fill="url(#metal)" stroke="#666"/>
 {"".join(f'<line x1="{x:.1f}" y1="{neck_top + 110}" x2="{x - 400 + 400 + (x - 400) * 0.6:.1f}" y2="680" stroke="#E8E8E8" stroke-width="{1.8 if bass else 1.1}"/>' for x in sx)}
 <circle cx="482" cy="645" r="12" fill="url(#metal)" stroke="#555"/><circle cx="496" cy="684" r="12" fill="url(#metal)" stroke="#555"/><circle cx="466" cy="708" r="12" fill="url(#metal)" stroke="#555"/>
 <path d="{GUITAR_BODY}" fill="url(#gloss)"/>
</g>"""


ACOUSTIC_BODY = ("M400,420 C470,420 515,455 515,515 C515,555 495,570 505,590 C520,615 552,630 552,670 "
                 "C552,735 490,772 400,772 C310,772 248,735 248,670 C248,630 280,615 295,590 C305,570 285,555 "
                 "285,515 C285,455 330,420 400,420 Z")


def acoustic(c):
    return f"""
<g filter="url(#soft)">
 <path d="{ACOUSTIC_BODY}" fill="url(#body)"/>
 <path d="{ACOUSTIC_BODY}" fill="none" stroke="#F3E6CC" stroke-width="6"/>
 <path d="{ACOUSTIC_BODY}" fill="none" stroke="#2a1608" stroke-opacity=".5" stroke-width="2"/>
 <circle cx="400" cy="545" r="50" fill="none" stroke="#3a2412" stroke-width="7"/>
 <circle cx="400" cy="545" r="50" fill="none" stroke="#F5E9D2" stroke-width="2" stroke-dasharray="4 3"/>
 <circle cx="400" cy="545" r="40" fill="#1a0e06"/>
 <path d="M440,570 C470,575 478,610 455,628 C440,640 420,628 425,605 Z" fill="#2a1608" opacity=".8"/>
 <rect x="350" y="680" width="100" height="18" rx="9" fill="#2a1608"/>
 <rect x="383" y="140" width="34" height="300" rx="4" fill="url(#maple)"/>
 <rect x="387" y="150" width="26" height="290" fill="url(#board)"/>
 {_frets(387, 26, 150, 440, 19)}
 <path d="M380,150 L380,70 C380,52 392,44 400,44 C408,44 420,52 420,70 L420,150 Z" fill="#2a1608"/>
 {"".join(f'<circle cx="{372 if i < 3 else 428}" cy="{70 + (i % 3) * 26}" r="7" fill="url(#metal)"/>' for i in range(6))}
 {"".join(f'<line x1="{391 + i * 3.6:.1f}" y1="150" x2="{382 + i * 7.2:.1f}" y2="689" stroke="#F0E2C4" stroke-width="1.1"/>' for i in range(6))}
 <path d="{ACOUSTIC_BODY}" fill="url(#gloss)"/>
</g>"""


def drums(c):
    def cyl(x, y, w, h, shell="url(#bodyL)"):
        return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{shell}"/>'
                f'<rect x="{x - 3}" y="{y - 4}" width="{w + 6}" height="8" rx="3" fill="url(#metal)"/>'
                f'<rect x="{x - 3}" y="{y + h - 4}" width="{w + 6}" height="8" rx="3" fill="url(#metal)"/>'
                f'<ellipse cx="{x + w / 2}" cy="{y - 2}" rx="{w / 2}" ry="{w / 9}" fill="#F2F2F2" stroke="#999"/>')

    def cymbal(cx, cy, r, tilt):
        return (f'<line x1="{cx}" y1="{cy}" x2="{cx}" y2="745" stroke="#8d9298" stroke-width="5"/>'
                f'<g transform="rotate({tilt} {cx} {cy})"><ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r * 0.22}" fill="url(#cymbal)" stroke="#7a520f"/>'
                f'<ellipse cx="{cx}" cy="{cy - 3}" rx="{r * 0.18}" ry="{r * 0.07}" fill="#E8C15A"/></g>')

    return f"""
<g filter="url(#soft)">
 {cymbal(170, 300, 105, -10)}{cymbal(650, 250, 115, 9)}{cymbal(95, 460, 70, 0)}
 <line x1="230" y1="560" x2="185" y2="745" stroke="#8d9298" stroke-width="4"/><line x1="230" y1="560" x2="275" y2="745" stroke="#8d9298" stroke-width="4"/>
 {cyl(130, 505, 150, 60)}
 <line x1="610" y1="640" x2="605" y2="745" stroke="#8d9298" stroke-width="5"/><line x1="710" y1="640" x2="715" y2="745" stroke="#8d9298" stroke-width="5"/>
 {cyl(590, 470, 140, 175)}
 <circle cx="400" cy="585" r="165" fill="url(#body)"/>
 <circle cx="400" cy="585" r="165" fill="none" stroke="url(#metal)" stroke-width="10"/>
 <circle cx="400" cy="585" r="140" fill="#F4F2EE"/>
 <circle cx="400" cy="585" r="140" fill="none" stroke="#ddd" stroke-width="2"/>
 <circle cx="400" cy="585" r="78" fill="none" stroke="{c[1]}" stroke-width="10"/>
 <circle cx="400" cy="585" r="62" fill="none" stroke="{c[1]}" stroke-opacity=".35" stroke-width="3"/>
 {"".join(f'<circle cx="{400 + 152 * __import__("math").cos(a * 0.5236):.1f}" cy="{585 + 152 * __import__("math").sin(a * 0.5236):.1f}" r="6" fill="url(#metal)"/>' for a in range(12))}
 {cyl(285, 330, 110, 85)}{cyl(410, 320, 120, 92)}
 <rect x="392" y="420" width="16" height="30" fill="#8d9298"/>
 <path d="M400,585 m-165,0 a165,165 0 0,1 330,0" fill="url(#gloss)" opacity=".7"/>
</g>"""


def keyboard(c):
    whites = 36
    x0, w = 90, 620 / whites
    keys = "".join(f'<rect x="{x0 + i * w:.2f}" y="430" width="{w - 1.4:.2f}" height="110" rx="2" fill="#FBFBFB" stroke="#cfcfcf" stroke-width=".8"/>' for i in range(whites))
    blacks = "".join(
        f'<rect x="{x0 + (i + 1) * w - w * 0.3:.2f}" y="430" width="{w * 0.6:.2f}" height="68" rx="2" fill="#111"/>'
        for i in range(whites - 1) if i % 7 not in (2, 6)
    )
    knobs = "".join(f'<circle cx="{150 + i * 38}" cy="378" r="11" fill="#222" stroke="#555"/><line x1="{150 + i * 38}" y1="370" x2="{150 + i * 38}" y2="376" stroke="#FF6A00" stroke-width="2"/>' for i in range(5))
    pads = "".join(f'<rect x="{520 + (i % 4) * 44}" y="{352 + (i // 4) * 30}" width="36" height="24" rx="4" fill="#FF6A00" opacity="{0.35 + (i % 3) * 0.25}"/>' for i in range(8))
    return f"""
<g filter="url(#soft)">
 <path d="M70,340 Q70,320 90,320 L710,320 Q730,320 730,340 L742,560 Q742,575 727,575 L73,575 Q58,575 58,560 Z" fill="url(#bodyL)"/>
 <rect x="80" y="420" width="640" height="130" rx="6" fill="#0d0d0d"/>
 {keys}{blacks}
 <rect x="345" y="350" width="150" height="54" rx="6" fill="#0f1a12" stroke="#333"/>
 <rect x="355" y="360" width="130" height="34" rx="3" fill="#1f3b2a"/>
 <text x="420" y="383" font-family="monospace" font-size="15" fill="#9dffb5" text-anchor="middle">PIANO 01</text>
 {knobs}{pads}
 <path d="M70,340 Q70,320 90,320 L710,320 Q730,320 730,340 L732,380 L68,380 Z" fill="url(#gloss)"/>
</g>"""


def mic(c):
    return """
<g filter="url(#soft)">
 <path d="M362,330 L438,330 L425,690 Q424,712 400,712 Q376,712 375,690 Z" fill="url(#bodyL)"/>
 <path d="M362,330 L438,330 L425,690 Q424,712 400,712 Q376,712 375,690 Z" fill="url(#gloss)"/>
 <rect x="378" y="690" width="44" height="40" rx="6" fill="url(#metal)"/>
 <circle cx="390" cy="718" r="3" fill="#333"/><circle cx="410" cy="718" r="3" fill="#333"/><circle cx="400" cy="726" r="3" fill="#333"/>
 <rect x="355" y="318" width="90" height="26" rx="8" fill="url(#metal)"/>
 <circle cx="400" cy="230" r="105" fill="url(#mesh)"/>
 <circle cx="400" cy="230" r="105" fill="none" stroke="url(#metal)" stroke-width="10"/>
 <path d="M296,230 H504" stroke="url(#metal)" stroke-width="8"/>
 <circle cx="400" cy="230" r="105" fill="url(#gloss)"/>
 <rect x="390" y="420" width="20" height="60" rx="4" fill="#FF6A00" opacity=".9"/>
</g>"""


def mixer(c):
    strips = []
    for i in range(8):
        x = 170 + i * 50
        strips.append("".join(
            f'<circle cx="{x}" cy="{215 + k * 44}" r="13" fill="#202020" stroke="#4a4a4a"/>'
            f'<line x1="{x}" y1="{205 + k * 44}" x2="{x}" y2="{213 + k * 44}" stroke="{["#FF6A00", "#FFFFFF", "#FFB061", "#9aa0a6"][k]}" stroke-width="3"/>'
            for k in range(4)))
        strips.append(f'<rect x="{x - 3}" y="420" width="6" height="190" rx="3" fill="#050505"/>'
                      f'<rect x="{x - 14}" y="{470 + (i * 37) % 110}" width="28" height="22" rx="3" fill="#E9E9E9" stroke="#888"/>'
                      f'<line x1="{x - 12}" y1="{481 + (i * 37) % 110}" x2="{x + 12}" y2="{481 + (i * 37) % 110}" stroke="#FF6A00" stroke-width="2"/>')
    meters = "".join(f'<rect x="{585 + (i % 2) * 18}" y="{215 + (i // 2) * 14}" width="12" height="9" rx="2" fill="{"#FF6A00" if i < 4 else "#3fdc6a"}"/>' for i in range(16))
    return f"""
<g filter="url(#soft)" transform="translate(400 420) scale(1 .82) skewX(-6) translate(-400 -420)">
 <rect x="130" y="170" width="540" height="470" rx="22" fill="url(#bodyL)"/>
 <rect x="140" y="180" width="520" height="450" rx="16" fill="#151515" opacity=".88"/>
 {"".join(strips)}{meters}
 <circle cx="612" cy="420" r="20" fill="#202020" stroke="#FF6A00" stroke-width="3"/>
 <rect x="597" y="470" width="6" height="140" rx="3" fill="#050505"/><rect x="608" y="470" width="6" height="140" rx="3" fill="#050505"/>
 <rect x="590" y="520" width="32" height="24" rx="3" fill="#FF6A00"/>
 <rect x="130" y="170" width="540" height="470" rx="22" fill="url(#gloss)" opacity=".5"/>
</g>"""


def speaker(c, monitor=False):
    if monitor:
        return """
<g filter="url(#soft)">
 <rect x="270" y="140" width="260" height="520" rx="22" fill="url(#bodyL)"/>
 <circle cx="400" cy="260" r="58" fill="#111"/><circle cx="400" cy="260" r="34" fill="url(#cone)"/><circle cx="400" cy="260" r="16" fill="url(#metal)"/>
 <circle cx="400" cy="470" r="112" fill="#111"/><circle cx="400" cy="470" r="96" fill="url(#cone)"/>
 <circle cx="400" cy="470" r="98" fill="none" stroke="#FF6A00" stroke-width="5"/>
 <circle cx="400" cy="470" r="34" fill="#222" stroke="#444"/>
 <rect x="270" y="140" width="260" height="520" rx="22" fill="url(#gloss)"/>
</g>"""
    return f"""
<g filter="url(#soft)">
 <path d="M255,110 L545,110 Q565,110 568,130 L600,690 Q602,712 580,712 L220,712 Q198,712 200,690 L232,130 Q235,110 255,110 Z" fill="url(#bodyL)"/>
 <path d="M262,128 L538,128 L572,692 L228,692 Z" fill="url(#grille)" opacity=".9"/>
 <path d="M318,170 L482,170 L460,300 L340,300 Z" fill="#0b0b0b" stroke="#333" stroke-width="3"/>
 <path d="M345,190 L455,190 L440,282 L360,282 Z" fill="url(#cone)"/>
 <circle cx="400" cy="500" r="155" fill="#0b0b0b"/>
 <circle cx="400" cy="500" r="140" fill="url(#cone)"/>
 <circle cx="400" cy="500" r="142" fill="none" stroke="{c[1]}" stroke-width="6"/>
 <circle cx="400" cy="500" r="48" fill="#262626" stroke="#4a4a4a" stroke-width="2"/>
 <circle cx="400" cy="500" r="48" fill="url(#gloss)"/>
 <rect x="370" y="660" width="60" height="14" rx="7" fill="{c[1]}"/>
</g>"""


def amp(c):
    knobs = "".join(f'<circle cx="{230 + i * 52}" cy="282" r="14" fill="#151515" stroke="#777" stroke-width="2"/><line x1="{230 + i * 52}" y1="271" x2="{230 + i * 52}" y2="279" stroke="#fff" stroke-width="2"/>' for i in range(7))
    return f"""
<g filter="url(#soft)">
 <rect x="335" y="190" width="130" height="34" rx="12" fill="#1a1a1a"/>
 <rect x="140" y="215" width="520" height="455" rx="22" fill="url(#bodyL)"/>
 <rect x="168" y="250" width="464" height="64" rx="8" fill="url(#metal)"/>
 {knobs}
 <circle cx="600" cy="282" r="7" fill="#FF3B1F"/><circle cx="600" cy="282" r="12" fill="#FF3B1F" opacity=".3"/>
 <rect x="168" y="330" width="464" height="315" rx="10" fill="url(#cloth)"/>
 <rect x="168" y="330" width="464" height="315" rx="10" fill="none" stroke="#c9a66b" stroke-width="4"/>
 <rect x="345" y="355" width="110" height="28" rx="6" fill="#FF6A00"/>
 <rect x="140" y="215" width="520" height="455" rx="22" fill="url(#gloss)" opacity=".6"/>
 <path d="M140,640 v8 q0,22 22,22 h22 v-30z M660,640 v8 q0,22 -22,22 h-22 v-30z" fill="url(#metal)"/>
</g>"""


PICK = "M0,-62 C38,-62 62,-46 56,-14 C50,22 16,56 0,68 C-16,56 -50,22 -56,-14 C-62,-46 -38,-62 0,-62 Z"


def picks(c):
    colors = ["url(#body)", "#111", "#F7F7F7", "#7A3E12", c[1], "#FF8A24"]
    items = []
    for i, (x, y, r) in enumerate([(300, 430, -25), (420, 380, 10), (520, 470, 32), (360, 560, -8), (470, 590, 20), (250, 560, -40)]):
        items.append(f'<g transform="translate({x} {y}) rotate({r}) scale(1.35)"><path d="{PICK}" fill="{colors[i]}" stroke="#000" stroke-opacity=".25" stroke-width="2"/><path d="{PICK}" fill="url(#gloss)"/>'
                     f'<text y="8" font-family="Arial Black,Arial" font-size="16" font-weight="900" fill="{"#111" if colors[i] in ("#F7F7F7",) else "#fff"}" text-anchor="middle" opacity=".85">{[".46", ".71", ".96", "1.2", ".60", ".88"][i]}</text></g>')
    return f'<g filter="url(#soft)">{"".join(items)}</g>'


def cable(c):
    loops = "".join(
        f'<ellipse cx="{400 + i * 9}" cy="{420 + i * 7}" rx="{205 - i * 4}" ry="{150 - i * 3}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="20"/>'
        f'<ellipse cx="{400 + i * 9}" cy="{420 + i * 7}" rx="{205 - i * 4}" ry="{150 - i * 3}" fill="none" stroke="{c[1]}" stroke-width="15"/>'
        f'<ellipse cx="{400 + i * 9}" cy="{414 + i * 7}" rx="{198 - i * 4}" ry="{144 - i * 3}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>'
        for i in range(6))
    plug = ('<g transform="translate({x} {y}) rotate({r})"><rect x="-16" y="0" width="32" height="70" rx="8" fill="#151515"/>'
            '<rect x="-14" y="62" width="28" height="18" fill="url(#metal)"/><rect x="-6" y="80" width="12" height="60" fill="url(#metal)"/>'
            '<rect x="-6" y="118" width="12" height="4" fill="#222"/><path d="M-6,140 L0,152 L6,140 Z" fill="url(#metal)"/>'
            '<rect x="-16" y="10" width="32" height="8" fill="{c}"/></g>')
    return f"""
<g filter="url(#soft)">
 {loops}
 <path d="M215,470 C170,560 190,620 250,640" fill="none" stroke="{c[1]}" stroke-width="15"/>
 <path d="M640,450 C700,520 690,600 610,640" fill="none" stroke="{c[1]}" stroke-width="15"/>
 {plug.format(x=250, y=625, r=-70, c="#FF6A00")}
 {plug.format(x=600, y=625, r=75, c="#FF6A00")}
</g>"""


def headphones(c):
    return f"""
<g filter="url(#soft)">
 <path d="M220,470 C200,230 320,140 400,140 C480,140 600,230 580,470" fill="none" stroke="#111" stroke-width="34" stroke-linecap="round"/>
 <path d="M226,460 C210,245 325,165 400,165 C475,165 590,245 574,460" fill="none" stroke="{c[1]}" stroke-width="10" stroke-linecap="round"/>
 <path d="M300,170 C340,150 460,150 500,170" fill="none" stroke="#2a2a2a" stroke-width="40" stroke-linecap="round"/>
 <rect x="196" y="410" width="24" height="90" rx="10" fill="url(#metal)"/><rect x="580" y="410" width="24" height="90" rx="10" fill="url(#metal)"/>
 <ellipse cx="220" cy="545" rx="92" ry="120" fill="#151515"/>
 <ellipse cx="215" cy="545" rx="78" ry="106" fill="url(#body)"/>
 <ellipse cx="215" cy="545" rx="40" ry="56" fill="none" stroke="#FF6A00" stroke-width="6"/>
 <ellipse cx="580" cy="545" rx="92" ry="120" fill="#151515"/>
 <ellipse cx="585" cy="545" rx="78" ry="106" fill="url(#body)"/>
 <ellipse cx="585" cy="545" rx="40" ry="56" fill="none" stroke="#FF6A00" stroke-width="6"/>
 <ellipse cx="200" cy="510" rx="40" ry="60" fill="url(#gloss)"/><ellipse cx="570" cy="510" rx="40" ry="60" fill="url(#gloss)"/>
</g>"""


def interface(c):
    def combo(x):
        return (f'<circle cx="{x}" cy="440" r="38" fill="#111" stroke="url(#metal)" stroke-width="6"/>'
                f'<circle cx="{x}" cy="440" r="11" fill="#333"/>'
                f'<circle cx="{x - 18}" cy="430" r="4" fill="#555"/><circle cx="{x + 18}" cy="430" r="4" fill="#555"/><circle cx="{x}" cy="462" r="4" fill="#555"/>')

    def gain(x):
        return (f'<circle cx="{x}" cy="440" r="30" fill="none" stroke="#3fdc6a" stroke-width="4" stroke-dasharray="70 120"/>'
                f'<circle cx="{x}" cy="440" r="22" fill="#1b1b1b" stroke="#555"/><line x1="{x}" y1="420" x2="{x}" y2="432" stroke="#fff" stroke-width="3"/>')

    return f"""
<g filter="url(#soft)">
 <path d="M190,330 L610,330 L650,370 L150,370 Z" fill="{c[0]}"/>
 <rect x="150" y="370" width="500" height="150" rx="18" fill="url(#bodyL)"/>
 {combo(215)}{gain(300)}{combo(385)}{gain(470)}
 <circle cx="575" cy="440" r="48" fill="#141414" stroke="url(#metal)" stroke-width="7"/>
 <circle cx="575" cy="440" r="48" fill="url(#gloss)"/>
 <line x1="575" y1="402" x2="575" y2="420" stroke="#fff" stroke-width="4"/>
 {"".join(f'<circle cx="{180 + i * 14}" cy="390" r="3.5" fill="{"#FF6A00" if i < 3 else "#3fdc6a"}"/>' for i in range(6))}
 <rect x="150" y="370" width="500" height="150" rx="18" fill="url(#gloss)" opacity=".7"/>
</g>"""


DRAW = {
    "electric": electric,
    "bass": lambda c: electric(c, bass=True),
    "acoustic": acoustic,
    "drums": drums,
    "keyboard": keyboard,
    "mic": mic,
    "mixer": mixer,
    "speaker": lambda c: speaker(c, monitor=c == PALETTES["white"]),
    "amp": amp,
    "picks": picks,
    "cable": cable,
    "headphones": headphones,
    "interface": interface,
}

# Transformação base (vista frontal) e foco do detalhe (x, y, zoom) por tipo
BASE = {
    "electric": "translate(400 405) rotate(-32) scale(1.02) translate(-400 -395)",
    "bass": "translate(400 405) rotate(-32) scale(.98) translate(-400 -390)",
    "acoustic": "translate(400 405) rotate(-28) scale(.98) translate(-400 -408)",
    "mic": "rotate(-28 400 420) translate(0 -10)",
}
FOCUS = {
    "electric": (400, 580, 2.0), "bass": (400, 580, 1.9), "acoustic": (400, 560, 1.9),
    "drums": (400, 560, 1.7), "keyboard": (330, 440, 2.2), "mic": (400, 240, 2.0),
    "mixer": (330, 360, 1.9), "speaker": (400, 480, 1.8), "amp": (400, 300, 2.0),
    "picks": (400, 460, 1.7), "cable": (420, 600, 1.8), "headphones": (300, 520, 1.8),
    "interface": (400, 440, 2.1),
}


def _bg_light(warm=False):
    a = "#FFF4EA" if warm else "#FAFAFA"
    return (f'<radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#FFFFFF"/>'
            f'<stop offset="1" stop-color="{a}"/></radialGradient>'), (
        '<rect width="800" height="800" fill="url(#bg)"/>'
        '<circle cx="620" cy="170" r="210" fill="#FF6A00" opacity=".07"/>'
        '<ellipse cx="400" cy="752" rx="270" ry="26" fill="#000" opacity=".18" filter="url(#blur)"/>')


def _bg_dark():
    return ('<radialGradient id="bg" cx="65%" cy="30%" r="85%"><stop offset="0" stop-color="#2a2a2a"/>'
            '<stop offset="1" stop-color="#0d0d0d"/></radialGradient>'), (
        '<rect width="800" height="800" fill="url(#bg)"/>'
        '<circle cx="560" cy="300" r="260" fill="#FF6A00" opacity=".22" filter="url(#blur)"/>'
        '<ellipse cx="400" cy="752" rx="270" ry="22" fill="#000" opacity=".6" filter="url(#blur)"/>')


def product_svg(kind: str, color: str, view: int) -> str:
    c = PALETTES[color]
    art = DRAW[kind](c)
    base = BASE.get(kind, "")
    if view == 1:
        g, bg = _bg_light()
        inner = f'<g transform="{base}">{art}</g>'
    elif view == 2:
        g, bg = _bg_dark()
        inner = f'<g transform="translate(800 0) scale(-1 1)"><g transform="{base}">{art}</g></g>'
    else:
        g, bg = _bg_light(warm=True)
        fx, fy, z = FOCUS[kind]
        inner = f'<g transform="translate(400 400) scale({z}) translate({-fx} {-fy})"><g transform="{base}">{art}</g></g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img">'
            f'<title>Ilustração de demonstração</title><defs>{defs(c)}{g}</defs>{bg}{inner}</svg>')


def category_svg(kind: str, color: str) -> str:
    c = PALETTES[color]
    art = DRAW[kind](c)
    base = BASE.get(kind, "")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="600" height="600" role="img">'
            f'<defs>{defs(c)}<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F1F1F"/>'
            f'<stop offset="1" stop-color="#0E0E0E"/></linearGradient></defs>'
            f'<rect width="800" height="800" fill="url(#bg)"/>'
            f'<circle cx="400" cy="420" r="300" fill="#FF6A00" opacity=".16" filter="url(#blur)"/>'
            f'<circle cx="400" cy="420" r="250" fill="none" stroke="#FF6A00" stroke-opacity=".35" stroke-width="2"/>'
            f'<g transform="translate(400 420) scale(.82) translate(-400 -420)"><g transform="{base}">{art}</g></g></svg>')


def banner_svg(items: list[tuple[str, str, str]], accent_x: int = 1150) -> str:
    """Banner 1600x700: fundo escuro com formas laranja; arte posicionada à direita."""
    all_defs = defs(PALETTES["orange"])
    groups = []
    for i, (kind, color, transform) in enumerate(items):
        c = PALETTES[color]
        d = defs(c).replace('id="', f'id="i{i}').replace('url(#', f'url(#i{i}')
        art = DRAW[kind](c).replace('url(#', f'url(#i{i}')
        base = BASE.get(kind, "")
        groups.append(f'<defs>{d}</defs><g transform="{transform}"><g transform="{base}">{art}</g></g>')
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700" width="1600" height="700" preserveAspectRatio="xMidYMid slice" role="img">
<defs>{all_defs}
<linearGradient id="bgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B0B0B"/><stop offset=".6" stop-color="#161616"/><stop offset="1" stop-color="#1F1209"/></linearGradient>
<linearGradient id="stripe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6A00" stop-opacity="0"/><stop offset="1" stop-color="#FF6A00"/></linearGradient>
</defs>
<rect width="1600" height="700" fill="url(#bgb)"/>
<circle cx="{accent_x}" cy="360" r="330" fill="#FF6A00" opacity=".28" filter="url(#blur)"/>
<circle cx="{accent_x}" cy="360" r="290" fill="none" stroke="#FF6A00" stroke-opacity=".5" stroke-width="2"/>
<circle cx="{accent_x}" cy="360" r="240" fill="none" stroke="#FF8A24" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="6 10"/>
<path d="M700,700 L1050,0 L1110,0 L760,700 Z" fill="url(#stripe)" opacity=".18"/>
<path d="M0,620 C200,560 300,690 520,640 C700,600 760,520 900,560" fill="none" stroke="#FF6A00" stroke-opacity=".35" stroke-width="2"/>
<path d="M0,650 C220,590 330,720 540,670 C720,630 780,550 920,590" fill="none" stroke="#FF6A00" stroke-opacity=".18" stroke-width="2"/>
{"".join(groups)}
</svg>"""


CATEGORY_ART = {
    "guitarras": ("electric", "sunburst"), "violoes": ("acoustic", "natural"), "baixos": ("bass", "teal"),
    "baterias-e-percussao": ("drums", "orange"), "teclados-e-pianos": ("keyboard", "black"),
    "microfones": ("mic", "silver"), "mesas-de-som": ("mixer", "black"), "caixas-de-som": ("speaker", "black"),
    "amplificadores": ("amp", "cream"), "acessorios": ("picks", "orange"), "equipamentos-de-audio": ("headphones", "orange"),
}


def main() -> None:
    (OUT / "products").mkdir(parents=True, exist_ok=True)
    (OUT / "categories").mkdir(parents=True, exist_ok=True)
    (OUT / "banners").mkdir(parents=True, exist_ok=True)
    n = 0
    for kind, color in sorted(image_combos()):
        for view in (1, 2, 3):
            (OUT / "products" / f"{kind}-{color}-{view}.svg").write_text(product_svg(kind, color, view), encoding="utf-8")
            n += 1
    for cat in CATEGORIES:
        kind, color = CATEGORY_ART[cat["slug"]]
        (OUT / "categories" / f"{cat['slug']}.svg").write_text(category_svg(kind, color), encoding="utf-8")
    banners = {
        "hero-guitarras": [("amp", "black", "translate(1010 150) scale(.55)"),
                           ("electric", "sunburst", "translate(870 -40) scale(.95)")],
        "hero-estudio": [("interface", "orange", "translate(1150 390) scale(.45)"),
                         ("mic", "silver", "translate(800 0) scale(.82)"),
                         ("headphones", "black", "translate(1170 10) scale(.5)")],
        "hero-bateria": [("drums", "orange", "translate(780 -30) scale(.95)")],
        "promo-audio": [("speaker", "black", "translate(1000 40) scale(.8)")],
    }
    for name, items in banners.items():
        (OUT / "banners" / f"{name}.svg").write_text(banner_svg(items), encoding="utf-8")
    print(f"✔ {n} imagens de produtos, {len(CATEGORIES)} de categorias e {len(banners)} banners gerados em {OUT}")


if __name__ == "__main__":
    main()
