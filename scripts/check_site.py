#!/usr/bin/env python3
"""Перевірка статичного сайту BurCob перед деплоєм."""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://www.burcob.online"
errors = []


def need(condition, message):
    if not condition:
        errors.append(message)


def read(path):
    file = ROOT / path
    need(file.is_file(), f"немає файлу {path}")
    if not file.is_file():
        return ""
    return file.read_text(encoding="utf-8")


def jpeg_size(path):
    data = (ROOT / path).read_bytes()
    index = 2
    while index < len(data) - 8:
        if data[index] != 0xFF:
            index += 1
            continue
        marker = data[index + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            height = int.from_bytes(data[index + 5:index + 7], "big")
            width = int.from_bytes(data[index + 7:index + 9], "big")
            return width, height
        if marker in (0xD8, 0xD9):
            index += 2
            continue
        length = int.from_bytes(data[index + 2:index + 4], "big")
        index += 2 + length
    return None


def h1_count(html):
    return len(re.findall(r"<h1[\s>]", html))


index = read("index.html")
english = read("en/index.html")
config = read("js/config.js")
script = read("google-apps-script/Code.gs")
workflow = read(".github/workflows/ci.yml")
readme = read("README.md")
robots = read("robots.txt")
sitemap = read("sitemap.xml")
styles = read("css/styles.css")
main_js = read("js/main.js")
manifest_text = read("site.webmanifest")
vercel_text = read("vercel.json")
page_404 = read("404.html")

need(not (ROOT / "CNAME").exists(), "CNAME лишився: на Vercel він конфліктує з доменом")
need(not (ROOT / ".github/workflows/pages.yml").exists(), "воркфлоу GitHub Pages лишився")
need("actions/deploy-pages" not in workflow, "CI не має деплоїти GitHub Pages")
need("pull_request" in workflow and "check_site.py" in workflow, "воркфлоу не перевіряє pull request")

for html, lang, canonical, title_part in (
    (index, "uk", f"{ORIGIN}/", "лендінги, адмінки, автоматизація та інтеграції"),
    (english, "en", f"{ORIGIN}/en/", "landing pages, admin panels, automation and integrations"),
):
    need(f'lang="{lang}"' in html, f"немає lang={lang}")
    need(h1_count(html) == 1, f"на сторінці {lang} має бути рівно один h1")
    need(f"<title>BurCob — {title_part}</title>" in html, f"немає title {lang}")
    need('name="description"' in html, f"немає meta description {lang}")
    need('property="og:title"' in html and 'property="og:image"' in html, f"немає Open Graph {lang}")
    need('name="twitter:card"' in html and "summary_large_image" in html, f"немає Twitter card {lang}")
    need(f'rel="canonical" href="{canonical}"' in html, f"немає canonical {canonical}")
    need(f'property="og:url" content="{canonical}"' in html, f"немає og:url {canonical}")
    need('hreflang="uk"' in html and 'hreflang="en"' in html and 'hreflang="x-default"' in html, f"немає hreflang {lang}")
    need(f'{ORIGIN}/"' in html and f'{ORIGIN}/en/"' in html, f"hreflang без обох URL {lang}")
    need("noindex" not in html.lower(), f"noindex на сторінці {lang}")
    need("https://t.me/tony_kobs" in html and "https://t.me/Groteskzp" in html, f"немає обох Telegram {lang}")
    need("https://github.com/BurCob" in html, f"немає GitHub організації {lang}")
    need("https://kanban.burcob.online" in html, f"немає посилання на канбан {lang}")
    need("company_url" in html, f"немає honeypot {lang}")
    need("lead-consent" in html, f"немає згоди {lang}")
    need("50%" in html, f"немає передоплати 50% {lang}")
    need('rel="manifest"' in html, f"немає manifest {lang}")
    need("/favicon.ico" in html, f"немає favicon {lang}")
    need("data-lang=\"uk\"" in html and "data-lang=\"en\"" in html, f"немає перемикача мови {lang}")
    need("burcob-lang" in html, f"немає вибору мови {lang}")
    need("navigator.webdriver" in html, f"немає захисту від редіректу ботів {lang}")
    for person in ("mykhailo", "natalia", "anton", "yuliana", "valeriy", "adam", "valentyn", "romanna"):
        need(f"/assets/team/{person}.webp" in html, f"немає фото {person} на сторінці {lang}")
        need((ROOT / "assets/team" / f"{person}.webp").is_file(), f"немає файлу фото {person}")

need("Михайло Максимов" in index and "Романна Брич" in index, "українська команда неповна")
need("Mykhailo Maksymov" in english and "Romanna Brych" in english, "англійська команда неповна")
need("Керівник проєкту" in index and "Project lead" in english, "немає ролі керівника")
need(index.count("<h1") == 1 and english.count("<h1") == 1, "зайвий h1")
need("noindex" not in page_404.lower(), "noindex на 404")
need("https://t.me/tony_kobs" in page_404 and "https://t.me/Groteskzp" in page_404, "404 без Telegram")

for price in ("5 000", "9 000", "16 000", "12 000", "22 000", "4 000", "8 000", "14 000", "400"):
    need(price in index and price in english, f"немає ціни {price}")

need(f"Sitemap: {ORIGIN}/sitemap.xml" in robots, "robots.txt без sitemap www")
need("Disallow" not in robots, "robots.txt щось забороняє")
need(f"<loc>{ORIGIN}/</loc>" in sitemap, "sitemap без української головної")
need(f"<loc>{ORIGIN}/en/</loc>" in sitemap, "sitemap без англійської сторінки")
need("xhtml:link" in sitemap and 'hreflang="uk"' in sitemap and 'hreflang="en"' in sitemap and 'hreflang="x-default"' in sitemap, "sitemap без hreflang")
need("burcob.online/" in sitemap and "https://burcob.online/" not in sitemap, "sitemap має канонічний www, без голого домену")

need("data-theme" in styles and "lang-switch" in styles and "person img" in styles, "стилі без теми, мови або фото команди")
need("GOOGLE_SCRIPT_URL" in config, "немає GOOGLE_SCRIPT_URL")
need("function doPost" in script and "appendRow" in script, "Apps Script не записує рядок")
need("ALLOWALL" in script, "Apps Script не дозволяє iframe")
need("setup" in readme and "Усі" in readme and "config.js" in readme, "README без інструкції до таблиці")
need("python3 -m http.server" in readme, "README без локального запуску")
need("www.burcob.online" in readme, "README без канонічного домену")
need("company_url" in script and "company_url" in main_js, "немає honeypot у скрипті")

url_match = re.search(r'GOOGLE_SCRIPT_URL:\s*"([^"]*)"', config)
need(url_match is not None, "у config.js немає GOOGLE_SCRIPT_URL")
if url_match:
    url = url_match.group(1).strip()
    ok_url = url == "" or re.fullmatch(r"https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec", url)
    need(ok_url, "GOOGLE_SCRIPT_URL має бути порожнім або URL вебзастосунку /exec")
    need(url != "", "GOOGLE_SCRIPT_URL порожній, форма не дійде в таблицю")

for secret in ("AIza", "ya29.", "private_key", "BEGIN PRIVATE", "Bearer ", "api_key", "client_secret"):
    blob = "\n".join((index, english, config, script, main_js))
    need(secret not in blob, f"схоже на секрет у репозиторії: {secret}")

vercel = json.loads(vercel_text) if vercel_text else {}
need(vercel.get("cleanUrls") is True, "vercel.json без cleanUrls")
need(vercel.get("trailingSlash") is True, "vercel.json без trailingSlash")
manifest = json.loads(manifest_text) if manifest_text else {}
need(manifest.get("name") == "BurCob" and manifest.get("icons"), "manifest порожній")

for path in ("assets/og-uk.jpg", "assets/og-en.jpg"):
    size = jpeg_size(path) if (ROOT / path).is_file() else None
    need(size == (1200, 630), f"{path} має бути 1200x630, зараз {size}")

for html, label in ((index, "uk"), (english, "en")):
    for match in re.findall(r'(?:src|href)="([^"]+)"', html):
        if match.startswith(("http://", "https://", "#", "mailto:", "data:")):
            continue
        path = match.split("?")[0].split("#")[0]
        if path in ("/", "/en", "/en/"):
            continue
        if path.startswith("/"):
            path = path[1:]
        if path.endswith("/"):
            path += "index.html"
        need((ROOT / path).is_file(), f"{label}: немає файлу за посиланням {match}")

for asset in (
    "assets/logo.webp",
    "assets/og-uk.jpg",
    "assets/og-en.jpg",
    "assets/favicon-32.png",
    "assets/apple-touch-icon.png",
    "assets/icon-512.png",
    "assets/kanban-doshka.jpg",
    "assets/kanban-kartka.jpg",
    "favicon.ico",
    ".nojekyll",
):
    need((ROOT / asset).is_file(), f"немає {asset}")

if errors:
    print("Помилки перевірки:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Сайт пройшов перевірку.")
