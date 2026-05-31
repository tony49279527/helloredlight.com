#!/usr/bin/env python3
"""Add missing hreflang to blog and buyers-guide pages."""
import os

SITE_DIR = "/Users/liangxile/Documents/HelloRedLight/helloredlight.com"
EN_URL = "https://helloredlight.com"
ZH_URL = "https://helloredlight.com/zh"

def add_hreflang(html_path, en_self_url, has_zh=True):
    """Add hreflang tags after canonical link."""
    with open(html_path) as f:
        content = f.read()
    
    if 'rel="alternate" hreflang="en"' in content or 'rel="alternate" hreflang="zh"' in content:
        return False  # already has hreflang
    
    # Build hreflang tags
    hreflang_block = f"""
    <link rel="alternate" hreflang="en" href="{EN_URL}{en_self_url}" />"""
    if has_zh:
        zh_alt_url = en_self_url.replace("/blog/", "/zh/blog/") if "/blog/" in en_self_url else f"/zh{en_self_url}"
        hreflang_block += f"""
    <link rel="alternate" hreflang="zh" href="{ZH_URL}{zh_alt_url}" />"""
    hreflang_block += f"""
    <link rel="alternate" hreflang="x-default" href="{EN_URL}{en_self_url}" />"""
    
    # Insert after canonical
    content = content.replace(
        'rel="canonical"',
        f'rel="canonical"{hreflang_block}',
        1
    )
    
    with open(html_path, 'w') as f:
        f.write(content)
    
    return True

# Blog index page (no zh version yet)
added = add_hreflang(
    os.path.join(SITE_DIR, "blog/index.html"),
    "/blog",
    has_zh=False  # zh blog doesn't exist yet
)
print(f"  {'✅' if added else '—'} blog/index.html — hreflang {'added' if added else 'already present'}")

# Blog posts (no zh versions yet)
blog_posts = [
    "wavelength-comparison-guide",
    "red-light-therapy-benefits",
    "red-light-therapy-for-gyms",
    "red-light-therapy-for-skincare-clinics",
    "how-to-start-red-light-therapy-business",
    "red-light-therapy-equipment-cost-guide",
    "how-to-choose-red-light-therapy-wholesale-supplier",
]
for slug in blog_posts:
    added = add_hreflang(
        os.path.join(SITE_DIR, f"blog/{slug}.html"),
        f"/blog/{slug}",
        has_zh=False
    )
    print(f"  {'✅' if added else '—'} blog/{slug}.html — hreflang {'added' if added else 'already present'}")

# Buyers guide (has no zh)
added = add_hreflang(
    os.path.join(SITE_DIR, "buyers-guide.html"),
    "/buyers-guide",
    has_zh=False
)
print(f"  {'✅' if added else '—'} buyers-guide.html — hreflang {'added' if added else 'already present'}")

print("\nDone. Note: zh versions of blog posts and buyers-guide still need to be created.")
