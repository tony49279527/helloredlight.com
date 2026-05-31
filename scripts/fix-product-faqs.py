#!/usr/bin/env python3
"""Add FAQ sections to all product pages."""
import os

PRODUCT_DIR = "/Users/liangxile/Documents/HelloRedLight/helloredlight.com"

PRODUCT_PAGES = {
    "silicone-led-mask.html": {
        "product": "Silicone LED Face Mask",
        "faqs": [
            ("What wavelengths does the Silicone LED Face Mask use?", "The mask combines 7 LED colors including 630nm (red), 660nm (deep red), and 850nm (near-infrared), plus blue, yellow, green, and cyan for comprehensive skin treatment."),
            ("Is this mask suitable for professional salon use?", "Yes. The flexible silicone design conforms to any face shape, and the mask supports multiple treatment modes for different skin concerns. It is designed for high-volume professional use."),
            ("What is the minimum order quantity for wholesale?", "Contact our sales team for MOQ details. We offer tiered pricing for bulk orders with custom branding options."),
            ("Does the mask come with OEM/private label options?", "Yes. We offer full OEM/ODM services including custom branding, packaging, and specification adjustments."),
        ]
    },
    "luxor-360-bed.html": {
        "product": "Luxor 360 Therapy Bed",
        "faqs": [
            ("What is the Luxor 360 Therapy Bed?", "The Luxor 360 is a full-body commercial-grade red light therapy bed with 360-degree coverage, designed for spas, clinics, and wellness centers."),
            ("What are the power specifications?", "The Luxor 360 features high-power LEDs with adjustable intensity, covering the full body in a single session."),
            ("Is the bed FDA cleared?", "Yes. All our devices are manufactured to FDA and CE standards. Contact us for specific registration documents."),
            ("What is the warranty period?", "Commercial-grade devices come with a standard warranty. Extended warranty options are available for enterprise clients."),
        ]
    },
    "mini-panel-300w.html": {
        "product": "Pro 300W Mini Panel",
        "faqs": [
            ("What is the Pro 300W Mini Panel best for?", "The Pro 300W is ideal for targeted treatments, small clinics, and home use. It delivers high irradiance in a compact form factor."),
            ("What wavelengths does it include?", "The panel combines 660nm (deep red) and 850nm (near-infrared) for both skin and deep tissue therapy."),
            ("Can this be wall-mounted or used on a stand?", "Yes. The panel comes with mounting options for flexible placement."),
            ("What is the irradiance output?", "Contact our technical team for detailed irradiance specifications at different distances."),
        ]
    },
    "laser-pen.html": {
        "product": "Targeted Cold Laser Pen",
        "faqs": [
            ("What is the Targeted Cold Laser Pen used for?", "The cold laser pen delivers concentrated photobiomodulation for targeted pain relief, wound healing, and acupoint stimulation."),
            ("Is it safe for at-home use?", "Yes. The device is designed for both professional and personal use with built-in safety timers and adjustable power levels."),
            ("What wavelength does it use?", "The pen uses clinically proven wavelengths for deep tissue penetration and cellular regeneration."),
            ("Does it come with training materials?", "Yes. Each unit includes usage guidelines and safety instructions."),
        ]
    },
    "therapy-belt.html": {
        "product": "Pain Relief Therapy Belt",
        "faqs": [
            ("What areas can the Therapy Belt treat?", "The flexible belt design wraps around the waist, back, knees, or shoulders for targeted red light therapy on joints and muscles."),
            ("How long should each session be?", "Typical sessions are 10-20 minutes per area. The belt includes automatic timer settings."),
            ("Is the belt wireless?", "Yes. The belt features a rechargeable battery for cord-free use during treatment."),
            ("Can it be used in a clinical setting?", "Yes. The therapy belt is designed for both home and professional use with durable medical-grade materials."),
        ]
    }
}

FAQ_TEMPLATE = """
    <!-- FAQ Section — AI Readiness -->
    <section class="bg-white py-16">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 class="text-3xl font-bold text-brand-dark mb-10 text-center">Frequently Asked Questions About {product}</h2>
            <div class="space-y-4" itemscope itemtype="https://schema.org/FAQPage">
{faq_items}
            </div>
        </div>
    </section>
"""

FAQ_ITEM_TEMPLATE = '''                <div class="border border-gray-200 rounded-lg p-6" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 class="text-lg font-semibold text-brand-dark mb-2" itemprop="name">{question}</h3>
                    <div class="text-gray-600" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <p itemprop="text">{answer}</p>
                    </div>
                </div>'''

for filename, info in PRODUCT_PAGES.items():
    path = os.path.join(PRODUCT_DIR, filename)
    if not os.path.exists(path):
        print(f"  SKIP {filename} — not found")
        continue
    
    with open(path) as f:
        content = f.read()
    
    # Check if FAQ section already exists
    if "Frequently Asked Questions" in content:
        print(f"  — {filename} — FAQ section already exists")
        continue
    
    # Build FAQ items
    faq_items = "\n".join(
        FAQ_ITEM_TEMPLATE.format(question=q, answer=a)
        for q, a in info["faqs"]
    )
    
    faq_section = FAQ_TEMPLATE.format(product=info["product"], faq_items=faq_items)
    
    # Insert before footer
    content = content.replace("    <footer", faq_section + "\n    <footer", 1)
    
    with open(path, 'w') as f:
        f.write(content)
    
    print(f"  ✅ {filename} — FAQ section added ({len(info['faqs'])} Q&A)")

print("\nDone.")
