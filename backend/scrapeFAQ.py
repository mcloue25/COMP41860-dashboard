import re
import json
import hashlib
import requests

from urllib.parse import urljoin
from collections import defaultdict
from bs4 import BeautifulSoup, Tag, NavigableString


SOURCE_URL = "https://www.ucd.ie/students/studentdesk/faqs/"



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


EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# Loose phone matcher (Ireland +353 / 01 / spaces). Keeps it conservative.
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{6,}\d)")



def normalize_heading(s: str) -> str:
    # Normalize curly quotes/apostrophes, whitespace, and case-insensitive matching
    s = (s or "").replace("’", "'")
    s = clean_text(s)
    return s


def sha1_id(section: str, question: str) -> str:
    raw = f"{section.strip()}|{question.strip()}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()

def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())

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
    # Deduplicate (url,text,target)
    seen = set()
    out = []
    for l in links:
        key = (l["url"], l["text"], l["target"])
        if key not in seen:
            seen.add(key)
            out.append(l)
    return out

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

def extract_media(answer_node: Tag, base_url: str):
    media = []

    # Images
    for img in answer_node.select("img[src]"):
        src = img.get("src", "").strip()
        if not src:
            continue
        media.append({
            "type": "image",
            "title": clean_text(img.get("alt", "")) or None,
            "url": urljoin(base_url, src),
        })

    # Video / embeds (iframes)
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


def looks_like_section_heading(tag: Tag) -> bool:
    # On many UCD pages, section headings are h2 with an id (anchors for “Jump to”)
    return tag.name in ("h2", "h3") and bool(tag.get_text(strip=True)) and bool(tag.get("id"))


def find_faq_items_within(section_root: Tag):
    """
    Tries multiple patterns because FAQ accordions vary by implementation.
    Returns list of (question_text, answer_node_tag).
    """
    items = []

    # Pattern A: <details><summary>Question</summary><div>Answer...</div></details>
    for details in section_root.select("details"):
        summary = details.find("summary")
        if not summary:
            continue
        q = clean_text(summary.get_text(" ", strip=True))
        # answer is the rest of details minus summary
        answer_parts = []
        for child in details.children:
            if isinstance(child, Tag) and child.name == "summary":
                continue
            if isinstance(child, Tag):
                answer_parts.append(child)
        answer_wrap = BeautifulSoup("<div></div>", "html.parser").div
        for p in answer_parts:
            answer_wrap.append(p)
        if q and answer_wrap.get_text(strip=True):
            items.append((q, answer_wrap))

    if items:
        return items

    # Pattern B: accordion cards where question is a heading and answer is following sibling
    # Common: h3.question + div.answer (or button + div)
    # We'll look for headings that look like questions, then capture until next heading of same level.
    headings = section_root.find_all(["h3", "h4"])
    for h in headings:
        q = clean_text(h.get_text(" ", strip=True))
        if not q or len(q) < 5:
            continue

        # Collect content until the next heading at same level within the same section
        answer_wrap = BeautifulSoup("<div></div>", "html.parser").div
        sib = h.next_sibling
        while sib:
            if isinstance(sib, Tag) and sib.name in ("h3", "h4"):
                break
            if isinstance(sib, Tag):
                answer_wrap.append(sib)
            sib = sib.next_sibling

        if answer_wrap.get_text(strip=True):
            items.append((q, answer_wrap))

    return items




def scrape():
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
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    allowed_norm = {normalize_heading(x).lower() for x in ALLOWED_SECTIONS}

    all_h2 = soup.find_all("h2")
    section_heads = []
    for h2 in all_h2:
        name = normalize_heading(h2.get_text(" ", strip=True))
        if name and name.lower() in allowed_norm:
            section_heads.append(h2)

    records = []
    section_counts = defaultdict(int)

    for s_idx, h2 in enumerate(section_heads, start=1):
        section_name = normalize_heading(h2.get_text(" ", strip=True))

        node = h2.find_next()
        q_idx = 0

        while node and not (isinstance(node, Tag) and node.name == "h2"):
            if isinstance(node, Tag) and node.name == "h3":
                question = clean_text(node.get_text(" ", strip=True))
                if not question:
                    node = node.find_next()
                    continue

                parts = []
                cur = node.next_sibling

                while cur:
                    # stop if we hit the next question/section heading
                    if isinstance(cur, Tag) and cur.name in ("h2", "h3"):
                        break

                    # keep only real element nodes (skip whitespace strings)
                    if isinstance(cur, Tag) and cur.name not in ("script", "style"):
                        parts.append(str(cur))

                    cur = cur.next_sibling

                answer_html = "".join(parts).strip()
                answer_soup = BeautifulSoup(answer_html or "<div></div>", "html.parser")
                answer_text = clean_text(answer_soup.get_text(" ", strip=True))

                # NOTE - Removing the question from the answer_text
                answer_text = answer_text.replace(question, '')

                if not answer_text:
                    node = cur
                    continue

                q_idx += 1
                section_counts[section_name] += 1  # increment counter
                
                # Extract any other info to be added to the JSON Object
                links = extract_links(answer_soup, SOURCE_URL)
                contacts = extract_contacts(answer_text)
                media = extract_media(answer_soup, SOURCE_URL)
                
                # Save record 
                records.append({
                    "section": section_name,
                    "question": question,
                    "answer_text": answer_text,
                    "answer_html": answer_html,
                    "links": links,
                    "contacts": contacts,
                    "media": media,
                    "source_url": SOURCE_URL,
                    "section_order": s_idx,
                    "question_order": q_idx,
                    "id": sha1_id(section_name, question),
                })

                node = cur
                continue

            node = node.find_next()

    return records, dict(section_counts)





def pretty_print_json(data):
    print(json.dumps(data, indent=2, ensure_ascii=False))


def load_JSON_object(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)



def scrape_helpdesk_data(output_path):
    ''' Function for scraping helpdesk data located at : https://www.ucd.ie/students/studentdesk/faqs/
    '''
    # Scrape sectional data
    data, counts = scrape()
    print("\nSection counts:")
    pretty_print_json(counts)
    print("\nTotal extracted:", len(data))

    # Save scraped data to JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print()
    


if __name__ == "__main__":
    ''' Main function for scraping data from the Student helpdesk FAQ page
    '''
    # Scrape FAQ data
    scrape_helpdesk_data('data/ucd_studentdesk_faqs.json')
    
    # Evaluation
    data = load_JSON_object('data/ucd_studentdesk_faqs.json')
    pretty_print_json(data[0])
    print("-"*30)
    pretty_print_json(data[-1])
