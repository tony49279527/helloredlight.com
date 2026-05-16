"""
Apply SEO/GEO fixes to all helloredlight.com HTML pages:
- Canonical tag
- hreflang tags (en/zh)
- BreadcrumbList schema
- Twitter Card (if missing)
- Page-specific schemas (FAQ, LocalBusiness, Article)
"""
import re
from pathlib import Path

BASE = Path.home() / "Documents/helloredlight.com"
BASE_URL = "https://helloredlight.com"

PAGES = {
    "index.html": {
        "canonical": f"{BASE_URL}/",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
        ],
        "schema": "Organization",
    },
    "products.html": {
        "canonical": f"{BASE_URL}/products",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Products", "url": f"{BASE_URL}/products"},
        ],
    },
    "product-detail.html": {
        "canonical": f"{BASE_URL}/product-detail",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Products", "url": f"{BASE_URL}/products"},
            {"name": "Pro 1500W Full-Body Panel", "url": f"{BASE_URL}/product-detail"},
        ],
    },
    "factory.html": {
        "canonical": f"{BASE_URL}/factory",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Factory", "url": f"{BASE_URL}/factory"},
        ],
        "extra_schema": "LocalBusiness",
    },
    "technology.html": {
        "canonical": f"{BASE_URL}/technology",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Technology", "url": f"{BASE_URL}/technology"},
        ],
        "extra_schema": "FAQPage",
    },
    "cases.html": {
        "canonical": f"{BASE_URL}/cases",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Success Stories", "url": f"{BASE_URL}/cases"},
        ],
    },
    "certifications.html": {
        "canonical": f"{BASE_URL}/certifications",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Certifications", "url": f"{BASE_URL}/certifications"},
        ],
    },
    "partnerships.html": {
        "canonical": f"{BASE_URL}/partnerships",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Partnerships", "url": f"{BASE_URL}/partnerships"},
        ],
    },
    "contact.html": {
        "canonical": f"{BASE_URL}/contact",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Contact", "url": f"{BASE_URL}/contact"},
        ],
    },
    "blog/index.html": {
        "canonical": f"{BASE_URL}/blog",
        "breadcrumb": [
            {"name": "Home", "url": f"{BASE_URL}/"},
            {"name": "Blog", "url": f"{BASE_URL}/blog"},
        ],
        "extra_schema": "Blog",
    },
}


def build_breadcrumb_schema(breadcrumbs: list) -> str:
    items = []
    for i, bc in enumerate(breadcrumbs):
        items.append(f"""{{
        "@type": "ListItem",
        "position": {i + 1},
        "name": "{bc['name']}",
        "item": "{bc['url']}"
    }}""")
    return f"""<script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {','.join(items)}
      ]
    }}
    </script>"""


def build_faq_schema() -> str:
    return """<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the difference between 630nm, 660nm, and 850nm red light wavelengths?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "630nm (bright red) targets the epidermis for skin surface treatments. 660nm (deep red) penetrates to the dermis for mitochondrial activation and inflammation reduction. 850nm (near-infrared) penetrates deepest into muscle and bone tissue for recovery and pain relief."
          }
        },
        {
          "@type": "Question",
          "name": "Are Hello Red Light devices FDA cleared?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our equipment holds FDA 510(k) clearance, Medical CE (Class IIa), ISO 13485 certification, and RoHS compliance. All certifications are available for review by wholesale partners."
          }
        },
        {
          "@type": "Question",
          "name": "Can I customize the red light panels with my own brand?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we offer full OEM/ODM services including logo engraving, custom shell colors, specific wavelength spectrums, and branded packaging. Minimum order quantities apply."
          }
        },
        {
          "@type": "Question",
          "name": "What is the typical lifespan of your LED panels?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our LED panels are rated for 50,000+ hours of use, backed by a comprehensive warranty program of up to 3 years with lifetime technical support."
          }
        }
      ]
    }
    </script>"""


def build_localbusiness_schema() -> str:
    return """<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Hello Red Light Manufacturing",
      "image": "https://helloredlight.com/images/factory_assembly.webp",
      "description": "State-of-the-art 10,000 sqm red light therapy manufacturing facility with 10+ years of experience, 30+ patents, and ISO 13485 certified production lines.",
      "areaServed": "Worldwide",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Red Light Therapy Equipment",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "OEM/ODM Manufacturing Services"
            }
          }
        ]
      }
    }
    </script>"""


def build_blog_schema() -> str:
    return """<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Hello Red Light B2B Industry Hub",
      "url": "https://helloredlight.com/blog",
      "description": "Latest advancements in red light therapy technology, clinical research, and B2B manufacturing updates.",
      "publisher": {
        "@type": "Organization",
        "name": "Hello Red Light",
        "url": "https://helloredlight.com"
      }
    }
    </script>"""


def build_canonical(url: str) -> str:
    return f'<link rel="canonical" href="{url}" />'


def build_hreflang(en_url: str, zh_url: str) -> str:
    return f'<link rel="alternate" hreflang="en" href="{en_url}" />\n    <link rel="alternate" hreflang="zh" href="{zh_url}" />\n    <link rel="alternate" hreflang="x-default" href="{en_url}" />'


def has_twitter_card(html: str) -> bool:
    return "twitter:card" in html


def apply_fix(filepath: Path, config: dict) -> bool:
    html = filepath.read_text(encoding="utf-8")
    original = html

    # 1. Add canonical tag (after charset/viewport meta tags, before other links)
    if 'rel="canonical"' not in html:
        html = html.replace(
            '<meta name="viewport"',
            f'{build_canonical(config["canonical"])}\n    <meta name="viewport"',
        )

    # 2. Add hreflang (after canonical)
    if 'hreflang' not in html:
        en_url = config["canonical"]
        zh_path = "/zh/" if en_url == f"{BASE_URL}/" else f"/zh{en_url.replace(BASE_URL, '')}"
        zh_url = f"{BASE_URL}{zh_path}"
        hreflang_tags = build_hreflang(en_url, zh_url)
        html = html.replace(
            '<meta name="viewport"',
            f'<meta name="viewport"',
        )
        # Insert after viewport meta
        html = html.replace(
            '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
            f'<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    {hreflang_tags}',
        )

    # 3. Add Twitter card if missing
    if not has_twitter_card(html):
        title_match = re.search(r'<title>([^<]+)</title>', html)
        desc_match = re.search(r'<meta name="description" content="([^"]+)"', html)
        title = title_match.group(1) if title_match else "Hello Red Light"
        desc = desc_match.group(1) if desc_match else "Red light therapy equipment manufacturer."
        twitter_tags = (
            f'<meta property="twitter:card" content="summary_large_image" />\n'
            f'    <meta property="twitter:title" content="{title}" />\n'
            f'    <meta property="twitter:description" content="{desc}" />\n'
            f'    <meta property="twitter:image" content="https://helloredlight.com/images/og-cover.jpg" />'
        )
        html = html.replace(
            '<meta property="og:image"',
            f'{twitter_tags}\n    <meta property="og:image"',
        )

    # 4. Add BreadcrumbList schema (before closing </head>)
    if '"BreadcrumbList"' not in html:
        breadcrumb = build_breadcrumb_schema(config["breadcrumb"])
        html = html.replace("</head>", f"\n    {breadcrumb}\n</head>")

    # 5. Add page-specific extra schema
    extra = config.get("extra_schema", "")
    if extra == "FAQPage" and '"FAQPage"' not in html:
        html = html.replace("</head>", f"\n    {build_faq_schema()}\n</head>")
    elif extra == "LocalBusiness" and '"LocalBusiness"' not in html:
        html = html.replace("</head>", f"\n    {build_localbusiness_schema()}\n</head>")
    elif extra == "Blog" and '"Blog"' not in html:
        html = html.replace("</head>", f"\n    {build_blog_schema()}\n</head>")

    if html != original:
        filepath.write_text(html, encoding="utf-8")
        return True
    return False


def main():
    for filename, config in PAGES.items():
        filepath = BASE / filename
        if not filepath.exists():
            print(f"⚠️  {filename}: 文件不存在")
            continue
        changed = apply_fix(filepath, config)
        status = "✅" if changed else "⏭️  (已存在)"
        print(f"{status} {filename}")


if __name__ == "__main__":
    main()
