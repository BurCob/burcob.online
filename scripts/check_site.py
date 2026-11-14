#!/usr/bin/env python3
"""Перевірка статичного сайту BurCob перед деплоєм."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
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


index = read("index.html")
config = read("js/config.js")
script = read("google-apps-script/Code.gs")
workflow = read(".github/workflows/pages.yml")
readme = read("README.md")
robots = read("robots.txt")
sitemap = read("sitemap.xml")
cname = read("CNAME")
styles = read("css/styles.css")
main_js = read("js/main.js")

need(cname.strip() == "burcob.online", "CNAME має містити рівно burcob.online")
need('lang="uk"' in index, "у index.html немає lang=uk")
need("<title>BurCob — лендінги, адмінки, автоматизація та інтеграції</title>" in index, "немає title")
need('name="description"' in index and "адмінпанелі" in index, "немає meta description")
need('property="og:title"' in index and 'property="og:image"' in index, "немає Open Graph")
need('rel="canonical"' in index and "https://burcob.online/" in index, "немає canonical")
need("favicon" in index, "немає посилання на favicon")
need("https://t.me/tony_kobs" in index, "немає посилання на Telegram")
need("https://github.com/BurCob" in index, "немає посилання на GitHub")
need("https://kanban.burcob.online" in index, "немає посилання на канбан")
need("company_url" in index and "company_url" in script and "company_url" in main_js, "немає honeypot")
need("lead-consent" in index and "Погоджуюсь" in index, "немає згоди")
need("50%" in index, "немає передоплати 50%")
need("Sitemap: https://burcob.online/sitemap.xml" in robots, "robots.txt без sitemap")
need("<loc>https://burcob.online/</loc>" in sitemap, "sitemap без головної")
need("data-theme" in styles and "prefers-color-scheme" not in styles or "data-theme" in index, "немає темної теми")

for price in ("5 000", "9 000", "16 000", "12 000", "22 000", "4 000", "8 000", "14 000", "400"):
    need(price in index, f"на сторінці немає ціни {price}")

need("function doPost" in script and "appendRow" in script, "Apps Script не записує рядок")
need("ALLOWALL" in script, "Apps Script не дозволяє iframe")
need("setup" in readme and "Усі" in readme and "config.js" in readme, "README без інструкції до таблиці")
need("python3 -m http.server" in readme, "README без локального запуску")
need("actions/deploy-pages" in workflow and "actions/upload-pages-artifact" in workflow, "немає деплою Pages")
need("pull_request" in workflow, "воркфлоу не перевіряє pull request")

url_match = re.search(r'GOOGLE_SCRIPT_URL:\s*"([^"]*)"', config)
need(url_match is not None, "у config.js немає GOOGLE_SCRIPT_URL")
if url_match:
    url = url_match.group(1).strip()
    ok_url = url == "" or re.fullmatch(r"https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec", url)
    need(ok_url, "GOOGLE_SCRIPT_URL має бути порожнім або URL вебзастосунку /exec")

for secret in ("AIza", "ya29.", "private_key", "BEGIN PRIVATE", "Bearer ", "api_key", "client_secret"):
    blob = "\n".join((index, config, script, main_js))
    need(secret not in blob, f"схоже на секрет у репозиторії: {secret}")

for match in re.findall(r'(?:src|href)="([^"]+)"', index):
    if match.startswith(("http://", "https://", "#", "mailto:")):
        continue
    need((ROOT / match.split("?")[0]).is_file(), f"немає файлу за посиланням {match}")

for asset in (
    "assets/logo.webp",
    "assets/og.jpg",
    "assets/favicon-32.png",
    "assets/apple-touch-icon.png",
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
