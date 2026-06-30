from __future__ import annotations

import html
import re
import shutil
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
PUBLIC_DIR = ROOT / "public" / "downloads"
REPORT_DATE = date(2026, 6, 30)

PRODUCTS = [
    ("product-detail.html", "pro-1500w-commercial-panel", "product-detail"),
    ("mini-panel-300w.html", "pro-300w-mini-panel", "mini-panel-300w"),
    ("luxor-360-bed.html", "luxor-360-therapy-bed", "luxor-360-bed"),
    ("silicone-led-mask.html", "silicone-led-face-mask", "silicone-led-mask"),
    ("laser-pen.html", "targeted-cold-laser-pen", "laser-pen"),
    ("therapy-belt.html", "pain-relief-therapy-belt", "therapy-belt"),
]

BRAND_RED = colors.HexColor("#E63946")
BRAND_DARK = colors.HexColor("#1A1A2E")
SOFT_GRAY = colors.HexColor("#F4F6F8")
TEXT_GRAY = colors.HexColor("#4B5563")


def strip_tags(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    value = (
        value.replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2011", "-")
        .replace("\u2212", "-")
        .replace("\u00d7", "x")
        .replace("\u00b2", "^2")
        .replace("\u2265", ">=")
        .replace("\u2264", "<=")
        .replace("\u00a0", " ")
    )
    return re.sub(r"\s+", " ", value).strip()


def first(pattern: str, content: str, default: str = "") -> str:
    match = re.search(pattern, content, re.I | re.S)
    return strip_tags(match.group(1)) if match else default


def table_rows(content: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for row_match in re.finditer(r"<tr[^>]*>(.*?)</tr>", content, re.I | re.S):
        cells = [
            strip_tags(cell.group(1))
            for cell in re.finditer(r"<t[dh][^>]*>(.*?)</t[dh]>", row_match.group(1), re.I | re.S)
        ]
        if len(cells) >= 2:
            rows.append(cells[:2])
    return rows


def procurement_rows(content: str) -> list[list[str]]:
    rows = []
    for match in re.finditer(
        r"<span[^>]*>([^<:]+:)</span>\s*<span[^>]*>(.*?)</span>",
        content,
        re.I | re.S,
    ):
        label = strip_tags(match.group(1)).rstrip(":")
        value = strip_tags(match.group(2))
        if label in {"Lead Time", "Shipping Port", "Payment Terms", "Warranty"}:
            rows.append([label, value])

    terms = first(r"\*\s*Terms:\s*(.*?)</p>", content)
    if terms:
        rows.append(["Trade Terms", terms])
    return rows


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D1D5DB"))
    canvas.line(18 * mm, 16 * mm, 192 * mm, 16 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(18 * mm, 10 * mm, "Hello Red Light Manufacturing | helloredlight.com")
    canvas.drawRightString(192 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_spec_sheet(source_file: str, output_slug: str, url_slug: str) -> Path:
    content = (ROOT / source_file).read_text(encoding="utf-8")
    title = first(r"<h1[^>]*>(.*?)</h1>", content, output_slug.replace("-", " ").title())
    sku = first(r"SKU:\s*([^|<]+)", content, "Confirm with sales")
    moq = first(r"Minimum Order \(MOQ\):\s*([^<]+)", content, "Confirm with sales")
    rows = table_rows(content)
    price_rows = rows[:5] if rows and "Quantity" in rows[0][0] else []
    spec_rows = rows[5:] if price_rows else rows
    commercial_rows = [["SKU", sku], ["Minimum Order", moq]] + procurement_rows(content)
    source_url = f"https://helloredlight.com/{url_slug}"

    output_path = OUTPUT_DIR / f"{output_slug}-spec-sheet.pdf"
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=22 * mm,
        title=f"{title} Specification Sheet",
        author="Hello Red Light Product Team",
        subject=f"Model-level product and procurement summary for {title}",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="BrandTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=25,
            textColor=BRAND_DARK,
            alignment=TA_LEFT,
            spaceAfter=5 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=BRAND_DARK,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=TEXT_GRAY,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Disclaimer",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=TEXT_GRAY,
            backColor=SOFT_GRAY,
            borderColor=colors.HexColor("#D1D5DB"),
            borderWidth=0.5,
            borderPadding=7,
            spaceBefore=5 * mm,
        )
    )

    story = []
    story.append(
        Table(
            [
                [
                    Paragraph(
                        '<font color="#E63946"><b>HELLO RED LIGHT</b></font><br/>'
                        '<font size="8" color="#6B7280">B2B OEM / ODM MANUFACTURING</font>',
                        ParagraphStyle("Brand", alignment=TA_LEFT, leading=12),
                    ),
                    Paragraph(
                        f"<b>SPECIFICATION SHEET</b><br/>Issued {REPORT_DATE.isoformat()}",
                        ParagraphStyle("DocMeta", alignment=TA_CENTER, fontSize=8, leading=12),
                    ),
                ]
            ],
            colWidths=[120 * mm, 54 * mm],
            style=TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LINEBELOW", (0, 0), (-1, -1), 1.5, BRAND_RED),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
                ]
            ),
        )
    )
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph(title, styles["BrandTitle"]))
    story.append(
        Paragraph(
            f"Source page: <link href='{source_url}' color='#E63946'>{source_url}</link>",
            styles["Small"],
        )
    )

    def make_table(data: list[list[str]], widths: list[float]) -> Table:
        formatted = [
            [Paragraph(str(cell), styles["Small"]) for cell in row]
            for row in data
        ]
        return Table(
            formatted,
            colWidths=widths,
            repeatRows=1,
            hAlign="LEFT",
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT_GRAY]),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            ),
        )

    if spec_rows:
        story.append(Paragraph("Technical Specifications", styles["Section"]))
        story.append(make_table([["Property", "Published value"], *spec_rows], [55 * mm, 119 * mm]))

    story.append(Paragraph("Procurement Information", styles["Section"]))
    story.append(make_table([["Item", "Published value"], *commercial_rows], [55 * mm, 119 * mm]))

    if price_rows:
        story.append(Paragraph("Indicative Volume Pricing", styles["Section"]))
        story.append(make_table(price_rows, [87 * mm, 87 * mm]))
        story.append(Paragraph("Pricing is indicative and subject to written quotation.", styles["Small"]))

    story.append(
        KeepTogether(
            [
                Paragraph(
                    "<b>Verification notice.</b> This sheet summarizes information published on "
                    "helloredlight.com on 2026-06-30. Configuration, pricing, lead time, regulatory "
                    "status and supplied documents must be confirmed in writing for the exact SKU "
                    "and destination market. This document is not a certificate or regulatory approval.",
                    styles["Disclaimer"],
                )
            ]
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "Request a model-specific compliance pack or quotation: "
            "<link href='mailto:sales@helloredlight.com' color='#E63946'>sales@helloredlight.com</link>",
            styles["Small"],
        )
    )

    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    return output_path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    generated = []
    for source, output_slug, url_slug in PRODUCTS:
        output = build_spec_sheet(source, output_slug, url_slug)
        public_copy = PUBLIC_DIR / output.name
        shutil.copy2(output, public_copy)
        generated.append(public_copy.relative_to(ROOT).as_posix())

    print(f"Generated {len(generated)} product specification PDFs:")
    for item in generated:
        print(f"- {item}")


if __name__ == "__main__":
    main()
