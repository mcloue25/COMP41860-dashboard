
# Imports


import os
import re
import json
import shutil
import hashlib
import requests
import unicodedata

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
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{6,}\d)")



# Utility Functions


def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def normalize_heading(s: str) -> str:
    s = (s or "").replace("’", "'")
    return clean_text(s)


def sha1_id(section: str, question: str) -> str:
    raw = f"{section.strip()}|{question.strip()}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()


def pretty_print_json(data):
    print(json.dumps(data, indent=2, ensure_ascii=False))


def load_JSON_object(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def create_folder(path) -> None:
    os.makedirs(path, exist_ok=True)



# NOTE -  Extraction Helpers
def extract_links(answer_node: Tag, base_url: str):
    links = []
    for a in answer_node.select("a[href]"):
        href = a.get("href", "").strip()
        if not href:
            continue

        links.append({
            "url": urljoin(base_url, href),
            "text": clean_text(a.get_text(" ", strip=True)),
            "target": a.get("target") if a.get("target") in ("_blank", "_self") else None
        })

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
        if len(re.sub(r"\D", "", cand)) >= 7:
            phones.append(cand)

    return {
        "emails": emails,
        "phones": sorted(set(phones))
    }


def extract_media(answer_node: Tag, base_url: str):
    media = []

    for img in answer_node.select("img[src]"):
        src = img.get("src", "").strip()
        if src:
            media.append({
                "type": "image",
                "title": clean_text(img.get("alt", "")) or None,
                "url": urljoin(base_url, src),
            })

    for iframe in answer_node.select("iframe[src]"):
        src = iframe.get("src", "").strip()
        if src:
            media.append({
                "type": "video",
                "title": clean_text(iframe.get("title") or "Embedded video"),
                "url": urljoin(base_url, src),
            })

    seen = set()
    out = []
    for m in media:
        key = (m["type"], m["title"], m["url"])
        if key not in seen:
            seen.add(key)
            out.append(m)

    return out



# NOTE - Scraping Logic
def scrape():
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-IE,en;q=0.9",
    }

    s = requests.Session()
    r = s.get(SOURCE_URL, headers=headers, timeout=30)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    allowed_norm = {normalize_heading(x).lower() for x in ALLOWED_SECTIONS}

    section_heads = [
        h2 for h2 in soup.find_all("h2")
        if normalize_heading(h2.get_text(" ", strip=True)).lower() in allowed_norm
    ]

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
                    if isinstance(cur, Tag) and cur.name in ("h2", "h3"):
                        break
                    if isinstance(cur, Tag) and cur.name not in ("script", "style"):
                        parts.append(str(cur))
                    cur = cur.next_sibling

                answer_html = "".join(parts).strip()
                answer_soup = BeautifulSoup(answer_html or "<div></div>", "html.parser")
                answer_text = clean_text(answer_soup.get_text(" ", strip=True))
                answer_text = answer_text.replace(question, '')

                if not answer_text:
                    node = cur
                    continue

                q_idx += 1
                section_counts[section_name] += 1

                records.append({
                    "section": section_name,
                    "question": question,
                    "answer_text": answer_text,
                    "answer_html": answer_html,
                    "links": extract_links(answer_soup, SOURCE_URL),
                    "contacts": extract_contacts(answer_text),
                    "media": extract_media(answer_soup, SOURCE_URL),
                    "source_url": SOURCE_URL,
                    "section_order": s_idx,
                    "question_order": q_idx,
                    "id": sha1_id(section_name, question),
                })

                node = cur
                continue

            node = node.find_next()

    return records, dict(section_counts)



# NOTE - Corpus Cleaning
def normalize_key(filename: str) -> str:
    base = os.path.splitext(os.path.basename(filename))[0]
    base = unicodedata.normalize("NFKD", base)
    base = "".join(ch for ch in base if not unicodedata.combining(ch))
    base = base.lower()
    base = re.sub(r"[^a-z0-9]+", "", base)
    return base


def index_folder(folder: str, exts: tuple[str, ...]):
    key_to_paths = defaultdict(list)
    all_paths = []

    for name in os.listdir(folder):
        p = os.path.join(folder, name)
        if os.path.isfile(p) and name.lower().endswith(exts):
            k = normalize_key(name)
            key_to_paths[k].append(p)
            all_paths.append(p)

    return key_to_paths, all_paths


def match_sets(meta_dir: str, md_dir: str):
    meta_map, _ = index_folder(meta_dir, (".json",))
    md_map, _ = index_folder(md_dir, (".md", ".markdown"))

    matches = []
    missing_meta = []
    missing_md = []
    collisions = []

    all_keys = set(meta_map) | set(md_map)

    for k in sorted(all_keys):
        metas = meta_map.get(k, [])
        mds = md_map.get(k, [])

        if len(metas) == 1 and len(mds) == 1:
            matches.append((k, metas[0], mds[0]))
        else:
            if not metas:
                missing_meta.append((k, mds))
            if not mds:
                missing_md.append((k, metas))
            if len(metas) > 1 or len(mds) > 1:
                collisions.append((k, metas, mds))

    return matches, missing_meta, missing_md, collisions


def write_match_report(out_path: str, matches, missing_meta, missing_md, collisions):
    report = {
        "matches": [{"key": k, "meta": m, "md": d} for k, m, d in matches],
        "missing_meta": [{"key": k, "md_candidates": mds} for k, mds in missing_meta],
        "missing_md": [{"key": k, "meta_candidates": metas} for k, metas in missing_md],
        "collisions": [{"key": k, "meta_candidates": metas, "md_candidates": mds} for k, metas, mds in collisions],
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)


def build_metadata_corpus(corpus_path) -> None:
    working_dir = '../../data/scraped_data_copy/'
    shutil.copytree(corpus_path, working_dir, dirs_exist_ok=True)
    clean_corpus(working_dir)


def clean_corpus(corpus_path):
    meta_dir = f"{corpus_path}metadata"
    md_dir = f"{corpus_path}parsed_markdown"

    matches, missing_meta, missing_md, collisions = match_sets(meta_dir, md_dir)

    write_match_report("../../data/name_match_report.json", matches, missing_meta, missing_md, collisions)

    print("Matches:", len(matches))
    print("Missing meta:", len(missing_meta))
    print("Missing md:", len(missing_md))
    print("Collisions:", len(collisions))



# Main
def main():
    faq_dataset_path = '../../data/datasets/ucd_studentdesk_faqs.json'
    corpus_path = '../../data/scraped_data/'

    # scrape_helpdesk_data(faq_dataset_path)

    # build_metadata_corpus(corpus_path)


if __name__ == "__main__":
    main()