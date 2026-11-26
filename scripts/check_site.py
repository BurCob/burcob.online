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
    (index, "uk", f"{ORIGIN}/", "лендінг під ключ: етапи, години й ціна"),
    (english, "en", f"{ORIGIN}/en/", "turnkey landing page: stages, hours and price"),
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
    need(f'hreflang="x-default" href="{ORIGIN}/"' in html, f"x-default має вести на українську {lang}")
    need(f'hreflang="x-default" href="{ORIGIN}/en/"' not in html, f"x-default лишився англійським {lang}")
    need("FAQPage" in html and html.count('class="faq-item"') == 6, f"немає шести питань FAQ {lang}")
    need("kanban-doshka.webp" in html and "kanban-kartka.webp" in html, f"немає webp канбану {lang}")
    need("kanban-doshka.jpg" not in html and "kanban-kartka.jpg" not in html, f"jpg канбану лишився {lang}")
    need('href="#produkt"' in html, f"немає розділу продукту {lang}")
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
    for person in ("natalia", "anton", "yuliana", "adam", "valentyn", "romanna"):
        need(f"/assets/team/{person}.webp" in html, f"немає фото {person} на сторінці {lang}")
        need((ROOT / "assets/team" / f"{person}.webp").is_file(), f"немає файлу фото {person}")
    for person in ("mykhailo", "valeriy"):
        need(f"/assets/team/{person}.webp" not in html, f"зайве фото {person} на сторінці {lang}")
        need(person not in html, f"{person} лишився на сторінці {lang}")
    need("data-team-carousel" in html and "data-team-prev" in html and "data-team-next" in html, f"немає каруселі команди {lang}")
    need('id="team-track"' in html and 'tabindex="0"' in html, f"карусель команди без клавіатури {lang}")

need(not (ROOT / "assets/team/mykhailo.webp").exists(), "фото mykhailo має бути видалене")
need(not (ROOT / "assets/team/valeriy.webp").exists(), "фото valeriy має бути видалене")
need("Наталія" in index and "Романна Брич" in index and "Михайло" not in index and "Валерій" not in index, "українська команда")
need("Natalia" in english and "Romanna Brych" in english and "Mykhailo" not in english and "Valeriy" not in english, "англійська команда")
need("scroll-snap-type" in styles and "team-track" in styles and "prefers-reduced-motion" in styles, "стилі каруселі")
need("initTeamCarousel" in main_js and "prefers-reduced-motion" in main_js, "немає скрипту каруселі")
need("IntersectionObserver" in main_js and "initReveal" in main_js, "немає scroll-reveal")
need(":focus-visible" in styles and "scroll-behavior: smooth" in styles, "немає фокуса або плавного скролу")
need(index.count("<h1") == 1 and english.count("<h1") == 1, "зайвий h1")
need("noindex" not in page_404.lower(), "noindex на 404")
need("https://t.me/tony_kobs" in page_404 and "https://t.me/Groteskzp" in page_404, "404 без Telegram")

for price in (
    "6&nbsp;300",
    "11&nbsp;100",
    "10&nbsp;500",
    "18&nbsp;600",
    "29&nbsp;100",
    "51&nbsp;300",
    "90&nbsp;300",
    "156&nbsp;300",
    "3&nbsp;900",
    "7&nbsp;200",
    "13&nbsp;200",
    "23&nbsp;700",
    "18&nbsp;900",
    "15&nbsp;300",
    "27&nbsp;600",
    "52&nbsp;200",
    "95&nbsp;400",
    "20&nbsp;400",
    "38&nbsp;400",
    "300&nbsp;₴",
    "35–62",
    "21–37",
    "97–171",
    "301–521",
):
    need(price in index and price in english, f"немає ціни {price}")

for stale in ("400&nbsp;₴/год", "400&nbsp;₴/hour", "400 ₴/год", "від 5&nbsp;000", "from 5&nbsp;000", "від 9&nbsp;000", "from 9&nbsp;000", "Студія випускників GoIT", "A studio of GoIT graduates"):
    need(stale not in index and stale not in english, f"застарілий фрагмент лишився: {stale}")

need(">Продукт<" in index and ">Product<" in english, "навігація не перейменована на Продукт")
need(">Кейс<" not in index and ">Case<" not in english, "пункт навігації Кейс лишився")
need("Кейси додаємо лише за згодою замовника" in index, "немає фрази про згоду на кейси")
need("We add case studies only with the client's consent." in english, "немає англійської фрази про згоду на кейси")
need("GoIT" in index and "GoIT" in english, "немає згадки GoIT в команді")
need("BurCob — орігамі-птах кобчик" in index, "немає alt героя")
need('src="/assets/logo.webp" alt=""' in index and 'src="/assets/logo.webp" alt=""' in english, "логотип у шапці має бути декоративним")

need(f"Sitemap: {ORIGIN}/sitemap.xml" in robots, "robots.txt без sitemap www")
need("Disallow" not in robots, "robots.txt щось забороняє")
need(f"<loc>{ORIGIN}/</loc>" in sitemap, "sitemap без української головної")
need(f"<loc>{ORIGIN}/en/</loc>" in sitemap, "sitemap без англійської сторінки")
need("xhtml:link" in sitemap and 'hreflang="uk"' in sitemap and 'hreflang="en"' in sitemap and 'hreflang="x-default"' in sitemap, "sitemap без hreflang")
need(f'hreflang="x-default" href="{ORIGIN}/"' in sitemap, "sitemap: x-default має вести на українську")
need(f'hreflang="x-default" href="{ORIGIN}/en/"' not in sitemap, "sitemap: x-default лишився англійським")
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

valentyn = ROOT / "assets/team/valentyn.webp"
if valentyn.is_file():
    need(valentyn.stat().st_size <= 50000, f"портрет Валентина заважкий: {valentyn.stat().st_size} байт")

for asset in (
    "assets/logo.webp",
    "assets/og-uk.jpg",
    "assets/og-en.jpg",
    "assets/favicon-32.png",
    "assets/apple-touch-icon.png",
    "assets/icon-512.png",
    "assets/kanban-doshka.webp",
    "assets/kanban-kartka.webp",
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
