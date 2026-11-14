/**
 * Заявки з burcob.online → поточна Google Таблиця.
 *
 * Скрипт має жити всередині таблиці: Розширення → Apps Script.
 * Секретів тут немає і не додавайте: URL вебзастосунку все одно публічний.
 *
 * Розгортання: вебзастосунок, виконувати як «Я», доступ «Усі» (Anyone).
 */

var HEADERS = ['Час', 'Ім’я', 'Контакт', 'Послуга', 'Пакет', 'Бюджет', 'Опис', 'Згода', 'Сторінка'];

/** Запустити один раз з редактора, щоб створити заголовки й видати доступ. */
function setup() {
  var sheet = sheet_();
  ensureHeaders_(sheet);
}

function doGet() {
  return HtmlService
    .createHtmlOutput(
      '<!doctype html><meta charset="utf-8"><title>BurCob</title>' +
      '<p>Ендпоінт заявок BurCob працює. Форма сайту надсилає POST.</p>'
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var nonce = String(params.nonce || '');
  var origin = safeOrigin_(params.origin);

  try {
    if (String(params.company_url || '').trim()) {
      return respond_({ source: 'burcob-lead', ok: true, nonce: nonce }, origin);
    }

    var name = clip_(params.name, 80);
    var contact = clip_(params.contact, 120);
    var service = clip_(params.service, 120);
    var packageName = clip_(params['package'], 160);
    var budget = clip_(params.budget, 80);
    var task = clip_(params.task, 2000);
    var consent = String(params.consent || '').trim();
    var page = clip_(params.page, 200);

    if (!name || !contact || !service || !packageName || !task || consent !== 'так') {
      return respond_({ source: 'burcob-lead', ok: false, nonce: nonce, error: 'invalid' }, origin);
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return respond_({ source: 'burcob-lead', ok: false, nonce: nonce, error: 'busy' }, origin);
    }

    try {
      var sheet = sheet_();
      ensureHeaders_(sheet);
      var when = Utilities.formatDate(new Date(), 'Europe/Kyiv', 'yyyy-MM-dd HH:mm:ss');
      sheet.appendRow([when, name, contact, service, packageName, budget, task, consent, page]);
    } finally {
      lock.releaseLock();
    }

    return respond_({ source: 'burcob-lead', ok: true, nonce: nonce }, origin);
  } catch (err) {
    return respond_({ source: 'burcob-lead', ok: false, nonce: nonce, error: 'server' }, origin);
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Скрипт не прив’язаний до таблиці. Відкрийте Apps Script через Розширення в самій таблиці.');
  }
  return ss.getSheets()[0];
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function clip_(value, max) {
  var text = String(value || '').replace(/\u0000/g, '').trim();
  if (text.length > max) text = text.slice(0, max);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function safeOrigin_(value) {
  var origin = String(value || '');
  if (/^https?:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(origin)) return origin;
  return '*';
}

function respond_(payload, origin) {
  var json = JSON.stringify(payload).replace(/</g, '\\u003c');
  var target = JSON.stringify(origin);
  var html = '<!doctype html><meta charset="utf-8"><title>BurCob</title><script>' +
    'var msg=' + json + ';' +
    'var origin=' + target + ';' +
    'function send(win, targetOrigin){try{win.postMessage(msg, targetOrigin);}catch(err){}}' +
    'var wins=[];' +
    'try{wins.push(window.top);}catch(err){}' +
    'try{wins.push(window.parent);}catch(err){}' +
    'try{if(window.parent)wins.push(window.parent.parent);}catch(err){}' +
    'try{if(window.parent&&window.parent.parent)wins.push(window.parent.parent.parent);}catch(err){}' +
    'for(var i=0;i<wins.length;i++){if(!wins[i])continue;send(wins[i], origin);send(wins[i], "*");}' +
    '</script>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
