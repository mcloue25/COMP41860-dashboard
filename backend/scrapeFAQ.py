import re
import json
import hashlib
import requests

from urllib.parse import urljoin
from collections import defaultdict
from bs4 import BeautifulSoup, Tag, NavigableString


# ------------------------------------------------------------
# Source page containing the Student Desk FAQ sections
# ------------------------------------------------------------
SOURCE_URL = "https://www.ucd.ie/students/studentdesk/faqs/"


# ------------------------------------------------------------
# Sections of the FAQ page we want to scrape
# Used to filter <h2> headings to only the relevant sections
# ------------------------------------------------------------
ALLOWED_SECTIONS = {
    "UCD Connect",
    "Fees",
    "Official Documents",
    "Form Stamping",
    "Registration",
    "Exams",
    "Graduate Research Theses",
    "Accommodation",
    "Lost Property",
    "Information for International Students",
    "Garda Vetting",
    "Conferring",
    "Staff Query",
}


# ------------------------------------------------------------
# Regex patterns used to extract contact information
# ------------------------------------------------------------
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# Loose phone matcher (Ireland +353 / 01 / spaces etc.)
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{6,}\d)")


# ------------------------------------------------------------
# Normalize heading text so comparisons are consistent
# ------------------------------------------------------------
def normalize_heading(s: str) -> str:
    # Replace curly apostrophes and clean whitespace
    s = (s or "").replace("’", "'")
    s = clean_text(s)
    return s


# ------------------------------------------------------------
# Create a deterministic ID for each FAQ
# Used for deduplication and stable referencing
# ------------------------------------------------------------
def sha1_id(section: str, question: str) -> str:
    raw = f"{section.strip()}|{question.strip()}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()


# ------------------------------------------------------------
# Clean whitespace from text
# ------------------------------------------------------------
def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


# ------------------------------------------------------------
# Extract hyperlinks from an answer block
# ------------------------------------------------------------
def extract_links(answer_node: Tag, base_url: str):

    links = []

    for a in answer_node.select("a[href]"):

        href = a.get("href", "").strip()

        if not href:
            continue

        url = urljoin(base_url, href)

        text = clean_text(a.get_text(" ", strip=True))

        target = a.get("target")

        links.append({
            "url": url,
            "text": text,
            "target": target if target in ("_blank", "_self") else None
        })

    # Deduplicate links
    seen = set()
    out = []

    for l in links:
        key = (l["url"], l["text"], l["target"])
        if key not in seen:
            seen.add(key)
            out.append(l)

    return out


# ------------------------------------------------------------
# Extract contact information (emails + phone numbers)
# ------------------------------------------------------------
def extract_contacts(answer_text: str):

    emails = sorted(set(EMAIL_RE.findall(answer_text or "")))

    phones = []

    for m in PHONE_RE.findall(answer_text or ""):

        cand = clean_text(m)

        # Filter obvious false positives
        if len(re.sub(r"\D", "", cand)) < 7:
            continue

        phones.append(cand)

    phones = sorted(set(phones))

    return {"emails": emails, "phones": phones}


# ------------------------------------------------------------
# Extract images and embedded media from answers
# ------------------------------------------------------------
def extract_media(answer_node: Tag, base_url: str):

    media = []

    # Extract images
    for img in answer_node.select("img[src]"):

        src = img.get("src", "").strip()

        if not src:
            continue

        media.append({
            "type": "image",
            "title": clean_text(img.get("alt", "")) or None,
            "url": urljoin(base_url, src),
        })

    # Extract embedded videos / iframes
    for iframe in answer_node.select("iframe[src]"):

        src = iframe.get("src", "").strip()

        if not src:
            continue

        title = iframe.get("title") or "Embedded video"

        media.append({
            "type": "video",
            "title": clean_text(title),
            "url": urljoin(base_url, src),
        })

    # Deduplicate
    seen = set()
    out = []

    for m in media:
        key = (m["type"], m["title"], m["url"])
        if key not in seen:
            seen.add(key)
            out.append(m)

    return out


# ------------------------------------------------------------
# Helper function to detect section headings
# ------------------------------------------------------------
def looks_like_section_heading(tag: Tag) -> bool:

    return (
        tag.name in ("h2", "h3")
        and bool(tag.get_text(strip=True))
        and bool(tag.get("id"))
    )


# ------------------------------------------------------------
# Build HTML fragment representing one FAQ section
# (content between two <h2> headings)
# ------------------------------------------------------------
def build_section_fragment_between(h2_start: Tag, h2_end: Tag | None) -> BeautifulSoup:

    parts = []

    for el in h2_start.next_elements:

        # Stop when we reach the next section heading
        if el is h2_end:
            break

        # Ignore scripts/styles
        if isinstance(el, Tag) and el.name not in ("script", "style"):
            parts.append(str(el))

    return BeautifulSoup("".join(parts), "html.parser")


# ------------------------------------------------------------
# Attempt to extract FAQ items from a section
# Supports multiple markup patterns
# ------------------------------------------------------------
def find_faq_items_within(section_root: Tag):

    items = []

    # Pattern A: <details><summary>Question</summary>Answer</details>
    for details in section_root.select("details"):

        summary = details.find("summary")

        if not summary:
            continue

        q = clean_text(summary.get_text(" ", strip=True))

        answer_wrap = BeautifulSoup("<div></div>", "html.parser").div

        for child in details.children:
            if isinstance(child, Tag) and child.name == "summary":
                continue
            if isinstance(child, Tag):
                answer_wrap.append(child)

        if q and answer_wrap.get_text(strip=True):
            items.append((q, answer_wrap))

    if items:
        return items


    # Pattern B: Bootstrap accordion structure
    for item in section_root.select(".accordion-item, .accordion .card, details"):

        q_el = item.select_one("button.accordion-button, h3, h4")

        if not q_el:
            continue

        q = clean_text(q_el.get_text(" ", strip=True))

        if not q:
            continue

        # Attempt to locate answer body
        a_el = (
            item.select_one(".accordion-collapse .accordion-body")
            or item.select_one(".accordion-body")
            or item.select_one(".accordion-collapse")
        )

        if not a_el:
            continue

        answer_wrap = BeautifulSoup("<div></div>", "html.parser").div

        for child in list(a_el.children):
            if isinstance(child, Tag):
                answer_wrap.append(child)

        if answer_wrap.get_text(strip=True):
            items.append((q, answer_wrap))

    if items:
        return items


    # Pattern C: Heading followed by content
    headings = section_root.find_all(["h3", "h4"])

    for h in headings:

        q = clean_text(h.get_text(" ", strip=True))

        if not q or len(q) < 5:
            continue

        answer_wrap = BeautifulSoup("<div></div>", "html.parser").div

        sib = h.next_sibling

        while sib:

            if isinstance(sib, Tag) and sib.name in ("h3", "h4"):
                break

            if isinstance(sib, Tag) and sib.name not in ("script", "style"):
                answer_wrap.append(sib)

            sib = sib.next_sibling

        if answer_wrap.get_text(strip=True):
            items.append((q, answer_wrap))

    return items


# ------------------------------------------------------------
# Main scraping function
# ------------------------------------------------------------
def scrape_FAQ_questions():

    # HTTP headers to mimic a real browser request
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-IE,en;q=0.9",
        "Referer": "https://www.ucd.ie/students/studentdesk/",
    }

    s = requests.Session()

    r = s.get(SOURCE_URL, headers=headers, timeout=30)

    # Debugging info about the response
    print("status:", r.status_code)
    print("final url:", r.url)
    print("len(html):", len(r.text))
    print("has <h2>:", "<h2" in r.text.lower())
    print("has accordion-item:", "accordion-item" in r.text)

    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    allowed_norm = {normalize_heading(x).lower() for x in ALLOWED_SECTIONS}

    # Identify section headings (<h2>) that match allowed sections
    section_heads = []

    for h2 in soup.find_all("h2"):

        name = normalize_heading(h2.get_text(" ", strip=True))

        if name and name.lower() in allowed_norm:
            section_heads.append(h2)

    records = []
    section_counts = defaultdict(int)

    # Iterate through each section
    for i, h2 in enumerate(section_heads):

        section_name = normalize_heading(h2.get_text(" ", strip=True))

        h2_end = section_heads[i + 1] if i + 1 < len(section_heads) else None

        section_root = build_section_fragment_between(h2, h2_end)

        # Debug info
        print(section_name, "accordion items:", len(section_root.select(".accordion-item")))

        # Restrict extraction to the primary accordion container
        acc = section_root.select_one(".accordion")
        items = acc.select(".accordion-item") if acc else section_root.select(".accordion-item")

        print(section_name, "items after accordion container filter:", len(items))

        # Print first two questions as sanity check
        qs = []

        for it in items[:2]:

            btn = it.select_one("button.accordion-button")

            qs.append(clean_text(btn.get_text(" ", strip=True)) if btn else "NO BUTTON")

        print(section_name, "first questions:", qs)

        q_idx = 0

        for item in items:

            btn = item.select_one("button.accordion-button")
            body = item.select_one(".accordion-body")

            if not btn or not body:
                continue

            question = clean_text(btn.get_text(" ", strip=True))
            answer_text = clean_text(body.get_text(" ", strip=True))

            if not question or not answer_text:
                continue

            q_idx += 1
            section_counts[section_name] += 1

            records.append({
                "section": section_name,
                "question": question,
                "answer_text": answer_text,
                "section_order": i + 1,
                "question_order": q_idx,
                "id": sha1_id(section_name, question),
            })

    return records, dict(section_counts)


# ------------------------------------------------------------
# Utility printing helpers
# ------------------------------------------------------------
def pretty_print_json(data):
    print(json.dumps(data, indent=2, ensure_ascii=False))


def load_JSON_object(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ------------------------------------------------------------
# Wrapper function to scrape + save dataset
# ------------------------------------------------------------
def scrape_helpdesk_data(output_path):

    data, counts = scrape_FAQ_questions()

    print("\nSection counts:")
    pretty_print_json(counts)
    print("\nTotal extracted:", len(data))

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ------------------------------------------------------------
# Script entry point
# ------------------------------------------------------------
if __name__ == "__main__":

    scrape_helpdesk_data('data/datasets/ucd_studentdesk_faqs.json')

    data = load_JSON_object('data/datasets/ucd_studentdesk_faqs.json')

    pretty_print_json(data[0])

    a-b

    print("-"*30)

    pretty_print_json(data[-1])