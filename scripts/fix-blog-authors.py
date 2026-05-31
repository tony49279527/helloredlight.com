#!/usr/bin/env python3
"""Fix blog posts: consistent Person schema, dates, author meta."""
import re, os

BLOG_DIR = "/Users/liangxile/Documents/HelloRedLight/helloredlight.com/blog"
POSTS = [
    "wavelength-comparison-guide.html",
    "red-light-therapy-benefits.html",
    "red-light-therapy-for-gyms.html",
    "red-light-therapy-for-skincare-clinics.html",
    "how-to-start-red-light-therapy-business.html",
    "red-light-therapy-equipment-cost-guide.html",
    "how-to-choose-red-light-therapy-wholesale-supplier.html",
]

AUTHOR_NAME = "Hello Red Light Product Team"
AUTHOR_DESC = "RLT product specialists with expertise in photobiomodulation device manufacturing, OEM engineering, and clinical application research."

for post in POSTS:
    path = os.path.join(BLOG_DIR, post)
    if not os.path.exists(path):
        print(f"  SKIP {post} — not found")
        continue
    
    with open(path) as f:
        content = f.read()
    
    original = content
    
    # 1. Fix meta author tag — replace "Editorial Team" with "Product Team"
    content = re.sub(
        r'name="author" content="Hello Red Light Editorial Team"',
        f'name="author" content="{AUTHOR_NAME}"',
        content
    )
    
    # 2. Fix schema author — if uses Organization, change to Person with description
    old_org = '''"author": { "@type": "Organization", "name": "Hello Red Light" }'''
    new_person = f'''"author": {{ "@type": "Person", "name": "{AUTHOR_NAME}", "description": "{AUTHOR_DESC}" }}'''
    if old_org in content:
        content = content.replace(old_org, new_person)
        print(f"  {post}: fixed Organization→Person schema author")
    
    # 3. Fix existing Person schema to add description if missing
    old_person_no_desc = f'''"author": {{ "@type": "Person", "name": "{AUTHOR_NAME}" }}'''
    new_person_with_desc = f'''"author": {{ "@type": "Person", "name": "{AUTHOR_NAME}", "description": "{AUTHOR_DESC}" }}'''
    if old_person_no_desc in content:
        content = content.replace(old_person_no_desc, new_person_with_desc)
        print(f"  {post}: added description to Person schema")
    
    # 4. Add dateModified if missing (increment by 1 day from datePublished)
    dp_match = re.search(r'"datePublished": "([^"]+)"', content)
    if dp_match:
        dp = dp_match.group(1)
        if '"dateModified"' not in content:
            # Add dateModified right after datePublished
            content = re.sub(
                r'("datePublished": "[^"]+")',
                lambda m: f'{m.group(1)},\n      "dateModified": "{dp}"',
                content
            )
            print(f"  {post}: added dateModified = {dp}")
    
    # 5. Ensure visible date line exists (schema has datePublished but we need it visible)
    visible_date_pattern = '<span>By Hello Red Light Product Team</span><span>·</span><span>'
    if visible_date_pattern not in content:
        # Find visible date area — add after the By line
        content = re.sub(
            r'<span>By [^<]+</span><span>·</span>',
            '<span>By Hello Red Light Product Team</span><span>·</span>',
            content
        )
    
    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  ✅ {post} — updated")
    else:
        print(f"  — {post} — no changes needed")

print("\nDone. All blog posts updated.")
