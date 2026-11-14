"""DADOS DE DEMONSTRAÇÃO — NÃO SÃO INFORMAÇÕES OFICIAIS DA LOJA.

Todos os produtos, marcas, preços, estoques e descrições abaixo são
FICTÍCIOS e existem apenas para demonstrar o funcionamento da loja.
As marcas (Vértice, Ressonar, Cadência, Orbe, Pulso, Lumen, Atlas Audio,
Nordsom) foram inventadas para este fim e não representam fabricantes reais.

As imagens são ilustrações vetoriais geradas por
`scripts/generate_demo_images.py` e salvas em frontend/public/demo/.
Antes de publicar a loja, remova estes dados (python -m scripts.seed --clear-demo)
e cadastre o catálogo real pelo painel administrativo.
"""

CATEGORIES = [
    {"name": "Guitarras", "slug": "guitarras", "icon": "Guitar", "order": 1,
     "description": "Guitarras elétricas para todos os estilos."},
    {"name": "Violões", "slug": "violoes", "icon": "Music2", "order": 2,
     "description": "Violões folk, clássicos e elétricos."},
    {"name": "Baixos", "slug": "baixos", "icon": "AudioWaveform", "order": 3,
     "description": "Contrabaixos de 4 e 5 cordas."},
    {"name": "Baterias e Percussão", "slug": "baterias-e-percussao", "icon": "Drum", "order": 4,
     "description": "Baterias acústicas, eletrônicas e percussão."},
    {"name": "Teclados e Pianos", "slug": "teclados-e-pianos", "icon": "Piano", "order": 5,
     "description": "Teclados, pianos digitais e controladores."},
    {"name": "Microfones", "slug": "microfones", "icon": "Mic", "order": 6,
     "description": "Microfones dinâmicos, condensadores e sem fio."},
    {"name": "Mesas de Som", "slug": "mesas-de-som", "icon": "SlidersVertical", "order": 7,
     "description": "Mesas analógicas e digitais."},
    {"name": "Caixas de Som", "slug": "caixas-de-som", "icon": "Speaker", "order": 8,
     "description": "Caixas ativas, passivas e monitores."},
    {"name": "Amplificadores", "slug": "amplificadores", "icon": "Volume2", "order": 9,
     "description": "Amplificadores para guitarra, baixo e violão."},
    {"name": "Acessórios", "slug": "acessorios", "icon": "Cable", "order": 10,
     "description": "Cabos, palhetas, correias e muito mais."},
    {"name": "Equipamentos de Áudio", "slug": "equipamentos-de-audio", "icon": "Headphones", "order": 11,
     "description": "Fones, interfaces e equipamentos de estúdio."},
]

# (slug, nome, categoria, marca, tipo_ilustração, cor, preço, promo, estoque, destaque, vendidos, dias_desde_cadastro)
_P = [
    ("guitarra-vertice-v-classic-sss-sunburst", "Guitarra Elétrica Vértice V-Classic SSS Sunburst", "guitarras", "Vértice", "electric", "sunburst", 3299, 2899, 12, True, 140, 40),
    ("guitarra-vertice-v-classic-hh-black", "Guitarra Elétrica Vértice V-Classic HH Black", "guitarras", "Vértice", "electric", "black", 3499, None, 8, False, 95, 60),
    ("guitarra-cadencia-aurora-orange", "Guitarra Elétrica Cadência Aurora Orange Burst", "guitarras", "Cadência", "electric", "orange", 4590, 3990, 3, True, 60, 5),
    ("guitarra-orbe-studio-junior-white", "Guitarra Elétrica Orbe Studio Junior Arctic White", "guitarras", "Orbe", "electric", "white", 1890, None, 20, False, 210, 90),
    ("violao-ressonar-f200-eletrico", "Violão Folk Ressonar F-200 Elétrico Natural", "violoes", "Ressonar", "acoustic", "natural", 1690, 1490, 15, True, 180, 30),
    ("violao-ressonar-c100-nylon", "Violão Clássico Ressonar C-100 Nylon", "violoes", "Ressonar", "acoustic", "amber", 890, None, 25, False, 260, 120),
    ("violao-cadencia-terra-mogno", "Violão Folk Cadência Terra Mogno", "violoes", "Cadência", "acoustic", "mahogany", 2790, None, 6, False, 40, 8),
    ("baixo-vertice-vb4-jazz-sunburst", "Contrabaixo Vértice VB-4 Jazz Sunburst", "baixos", "Vértice", "bass", "sunburst", 3890, 3490, 7, True, 75, 25),
    ("baixo-orbe-groove-5-black", "Contrabaixo Orbe Groove 5 Cordas Black", "baixos", "Orbe", "bass", "black", 2990, None, 0, False, 35, 70),
    ("baixo-orbe-groove-4-teal", "Contrabaixo Orbe Groove 4 Cordas Teal", "baixos", "Orbe", "bass", "teal", 2490, None, 9, False, 50, 12),
    ("bateria-pulso-stage-22-black", "Bateria Acústica Pulso Stage 22\" Black", "baterias-e-percussao", "Pulso", "drums", "black", 5990, 5290, 4, True, 30, 45),
    ("bateria-pulso-junior-16-orange", "Bateria Acústica Pulso Junior 16\" Orange", "baterias-e-percussao", "Pulso", "drums", "orange", 2490, None, 6, False, 55, 3),
    ("bateria-pulso-studio-wine", "Bateria Acústica Pulso Studio 20\" Wine Red", "baterias-e-percussao", "Pulso", "drums", "wine", 4390, None, 2, False, 18, 15),
    ("teclado-lumen-k61", "Teclado Arranjador Lumen K-61", "teclados-e-pianos", "Lumen", "keyboard", "black", 1990, 1690, 10, True, 120, 50),
    ("piano-digital-lumen-p88-white", "Piano Digital Lumen P-88 Home White", "teclados-e-pianos", "Lumen", "keyboard", "white", 4290, None, 5, False, 44, 20),
    ("controlador-midi-lumen-pad49", "Controlador MIDI Lumen Pad 49", "teclados-e-pianos", "Lumen", "keyboard", "orange", 990, None, 18, False, 98, 2),
    ("microfone-atlas-d58-vocal", "Microfone Dinâmico Atlas Audio D-58 Vocal", "microfones", "Atlas Audio", "mic", "black", 449, 389, 40, False, 320, 100),
    ("microfone-atlas-c1-studio", "Microfone Condensador Atlas Audio C-1 Studio", "microfones", "Atlas Audio", "mic", "silver", 1190, None, 12, True, 88, 18),
    ("microfone-atlas-duo-uhf", "Microfone Sem Fio Atlas Audio Duo UHF", "microfones", "Atlas Audio", "mic", "orange", 1590, None, 2, False, 27, 6),
    ("mesa-nordsom-mx12-usb", "Mesa de Som Analógica Nordsom MX-12 USB", "mesas-de-som", "Nordsom", "mixer", "black", 2390, 2090, 6, True, 64, 35),
    ("mesa-nordsom-dx16-digital", "Mesa de Som Digital Nordsom DX-16", "mesas-de-som", "Nordsom", "mixer", "silver", 6890, None, 3, False, 12, 10),
    ("caixa-nordsom-pa15-ativa", "Caixa Ativa Nordsom PA-15 1000W", "caixas-de-som", "Nordsom", "speaker", "black", 3190, None, 8, True, 70, 28),
    ("caixa-nordsom-pa10-compacta", "Caixa Ativa Nordsom PA-10 Compacta", "caixas-de-som", "Nordsom", "speaker", "orange", 1790, 1590, 14, False, 85, 14),
    ("amp-cadencia-tube-30", "Amplificador Valvulado Cadência Tube 30", "amplificadores", "Cadência", "amp", "cream", 5490, None, 4, True, 22, 22),
    ("amp-orbe-combo-20", "Amplificador para Guitarra Orbe Combo 20", "amplificadores", "Orbe", "amp", "black", 990, 849, 22, False, 190, 80),
    ("amp-orbe-bass-100", "Amplificador para Baixo Orbe Bass 100", "amplificadores", "Orbe", "amp", "orange", 2190, None, 7, False, 33, 9),
    ("palhetas-vertice-mix-12", "Kit de Palhetas Vértice Mix (12 unidades)", "acessorios", "Vértice", "picks", "orange", 39.9, None, 200, False, 600, 150),
    ("cabo-atlas-p10-6m", "Cabo P10 Atlas Audio Pro 6 m", "acessorios", "Atlas Audio", "cable", "black", 89.9, 74.9, 80, False, 410, 110),
    ("cabo-atlas-xlr-10m", "Cabo XLR Atlas Audio Balanceado 10 m", "acessorios", "Atlas Audio", "cable", "orange", 129.9, None, 4, False, 150, 4),
    ("fone-atlas-monitor-h50", "Fone de Ouvido Atlas Audio Monitor H-50", "equipamentos-de-audio", "Atlas Audio", "headphones", "black", 690, 590, 25, True, 230, 33),
    ("interface-atlas-duo-2x2", "Interface de Áudio Atlas Audio Duo 2x2 USB-C", "equipamentos-de-audio", "Atlas Audio", "interface", "orange", 1290, None, 11, False, 150, 16),
    ("monitor-nordsom-m5-par", "Monitor de Referência Nordsom M5 (par)", "equipamentos-de-audio", "Nordsom", "speaker", "white", 2690, None, 5, False, 26, 1),
]

_DESC = {
    "electric": ("Guitarra elétrica de corpo sólido com timbre versátil, braço confortável e ótima "
                 "estabilidade de afinação. Ideal para estudo, ensaios e palco."),
    "acoustic": ("Violão com projeção equilibrada e timbre encorpado, construído para conforto "
                 "em longas sessões de prática e apresentações."),
    "bass": ("Contrabaixo elétrico com graves definidos e médios presentes, braço de pegada rápida "
             "e eletrônica simples de ajustar."),
    "drums": ("Kit completo com cascos de boa ressonância e ferragens robustas. Pronto para ensaios, "
              "estúdio e apresentações."),
    "keyboard": ("Instrumento de teclas com resposta dinâmica, conexão USB-MIDI e timbres variados "
                 "para estudo e produção."),
    "mic": ("Microfone com captação clara e baixo ruído de manuseio, indicado para voz e instrumentos "
            "em palco e estúdio."),
    "mixer": ("Mesa de som com pré-amplificadores silenciosos, equalização por canal e saída USB "
              "para gravação."),
    "speaker": ("Caixa de som com resposta de frequência equilibrada e proteção contra sobrecarga, "
                "para eventos, igrejas e estúdios."),
    "amp": ("Amplificador com timbres limpos cristalinos e saturação dinâmica, com controles "
            "intuitivos e construção resistente."),
    "picks": "Acessório essencial para músicos, com ótima durabilidade e pegada firme.",
    "cable": ("Cabo com blindagem de alta densidade, conectores reforçados e capa flexível, "
              "reduzindo ruídos e interferências."),
    "headphones": ("Fone fechado de monitoração com isolamento acústico, resposta plana e conforto "
                   "para longas sessões."),
    "interface": ("Interface de áudio USB-C com pré-amplificadores de baixo ruído, phantom power "
                  "e monitoração direta sem latência."),
}

_SPECS = {
    "electric": [("Corpo", "Basswood"), ("Braço", "Maple, parafusado"), ("Escala", "Rosewood, 22 trastes"),
                 ("Captadores", "Configuração conforme modelo"), ("Ponte", "Tremolo vintage"), ("Cordas", "6")],
    "acoustic": [("Tampo", "Spruce"), ("Laterais e fundo", "Mogno"), ("Escala", "Rosewood, 20 trastes"),
                 ("Tarraxas", "Blindadas"), ("Cordas", "6")],
    "bass": [("Corpo", "Alder"), ("Braço", "Maple"), ("Escala", "Rosewood, 20 trastes"),
             ("Captadores", "Single coil x2"), ("Escala (comprimento)", "34\"")],
    "drums": [("Bumbo", "22\" x 18\""), ("Tons", "10\" e 12\""), ("Surdo", "16\""), ("Caixa", "14\" x 5,5\""),
              ("Ferragens", "Inclusas"), ("Pratos", "Não inclusos")],
    "keyboard": [("Teclas", "61 sensitivas"), ("Polifonia", "64 vozes"), ("Conexões", "USB-MIDI, P10, Sustain"),
                 ("Alimentação", "Fonte bivolt inclusa")],
    "mic": [("Tipo", "Conforme modelo"), ("Padrão polar", "Cardioide"), ("Resposta", "50 Hz – 15 kHz"),
            ("Conector", "XLR")],
    "mixer": [("Canais", "12"), ("Equalização", "3 bandas por canal"), ("Efeitos", "Processador interno"),
              ("Interface", "USB 2 canais")],
    "speaker": [("Potência", "Conforme modelo"), ("Falante", "Woofer + driver"), ("Entradas", "XLR/P10 combo"),
                ("Alimentação", "Bivolt")],
    "amp": [("Potência", "Conforme modelo"), ("Falante", "1 x 12\""), ("Canais", "2 (Clean/Drive)"),
            ("Equalização", "3 bandas"), ("Saída de fone", "Sim")],
    "picks": [("Quantidade", "12 unidades"), ("Espessuras", "0,46 / 0,71 / 0,96 mm"), ("Material", "Celuloide")],
    "cable": [("Conectores", "Conforme modelo"), ("Blindagem", "Malha de cobre"), ("Capa", "PVC flexível")],
    "headphones": [("Tipo", "Over-ear fechado"), ("Impedância", "38 Ω"), ("Resposta", "15 Hz – 24 kHz"),
                   ("Cabo", "Removível, 3 m")],
    "interface": [("Entradas", "2 combo XLR/P10"), ("Saídas", "2 balanceadas + fone"), ("Resolução", "24 bits / 192 kHz"),
                  ("Conexão", "USB-C")],
}


def products() -> list[dict]:
    out = []
    for slug, name, cat, brand, kind, color, price, promo, stock, featured, sold, age in _P:
        out.append({
            "slug": slug, "name": name, "category_slug": cat, "brand": brand,
            "kind": kind, "color": color,
            "sku": "DEMO-" + "".join(w[0] for w in slug.split("-")[:4]).upper() + f"-{len(out) + 1:03d}",
            "price": float(price), "promo_price": float(promo) if promo else None,
            "stock": stock, "featured": featured, "sold_count": sold, "age_days": age,
            "description": _DESC[kind] + "\n\nProduto fictício de demonstração — não está à venda.",
            "specs": [{"label": l, "value": v} for l, v in _SPECS[kind]] + [{"label": "Cor", "value": color.title()}],
            "images": [f"/demo/products/{kind}-{color}-{i}.svg" for i in (1, 2, 3)],
        })
    return out


def image_combos() -> set[tuple[str, str]]:
    return {(p[4], p[5]) for p in _P}
