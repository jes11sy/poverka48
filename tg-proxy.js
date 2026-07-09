/**
 * POST / — принимает JSON от nginx (/tg-notify → 127.0.0.1:3378).
 * Уходит в api.telegram.org через прокси (HTTP CONNECT или SOCKS5).
 *
 * Установка: npm install && node tg-proxy.js
 * systemd: см. deploy/tg-proxy.service
 *
 * TG_PROXY_TYPE=http | socks5 (по умолчанию http)
 * TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TG_PROXY_HOST, TG_PROXY_PORT, TG_PROXY_USER, TG_PROXY_PASS
 */
'use strict';

const http = require('http');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const SITE_NAME = process.env.SITE_NAME || 'poverka-48.ru';
const DEFAULT_CITY = process.env.DEFAULT_CITY || 'Липецк';
const PROXY_HOST = process.env.TG_PROXY_HOST || '89.34.106.169';
const PROXY_PORT = parseInt(process.env.TG_PROXY_PORT || '8410', 10);
const PROXY_USER = process.env.TG_PROXY_USER || 'user391172';
const PROXY_PASS = process.env.TG_PROXY_PASS || '1c5jnf';
const PROXY_TYPE = (process.env.TG_PROXY_TYPE || 'http').toLowerCase();

const LISTEN_HOST = process.env.TG_LISTEN_HOST || '127.0.0.1';
const LISTEN_PORT = parseInt(process.env.TG_LISTEN_PORT || '3378', 10);

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildProxyAgent() {
    const u = encodeURIComponent(PROXY_USER);
    const p = encodeURIComponent(PROXY_PASS);
    if (PROXY_TYPE === 'socks5' || PROXY_TYPE === 'socks') {
        return new SocksProxyAgent(
            'socks5://' + u + ':' + p + '@' + PROXY_HOST + ':' + PROXY_PORT
        );
    }
    return new HttpsProxyAgent('http://' + u + ':' + p + '@' + PROXY_HOST + ':' + PROXY_PORT);
}

const agent = buildProxyAgent();

function buildStructuredMessage(data) {
    const lines = [
        '\u{1F514} <b>Новая заявка с сайта ' + escHtml(SITE_NAME) + '</b>',
        '',
        '\u{1F464} <b>Имя:</b> ' + escHtml(data.name || 'Не указано'),
        '\u{1F4DE} <b>Телефон:</b> ' + escHtml(data.phone || 'Не указано')
    ];

    if (data.service) {
        lines.push('\u{1F527} <b>Услуга:</b> ' + escHtml(data.service));
    }
    if (data.city) {
        lines.push('\u{1F4CD} <b>Город:</b> ' + escHtml(data.city));
    }
    if (data.counters) {
        lines.push('\u{1F522} <b>Количество счетчиков:</b> ' + escHtml(data.counters));
    }
    if (data.address) {
        lines.push('\u{1F3E0} <b>Адрес:</b> ' + escHtml(data.address));
    }
    if (data.message) {
        lines.push('\u{1F4AC} <b>Комментарий:</b> ' + escHtml(data.message));
    }
    if (data.type) {
        lines.push('\u{1F4CB} <b>Тип заявки:</b> ' + escHtml(data.type));
    }

    lines.push('\u23F0 <b>Время:</b> ' + escHtml(new Date().toLocaleString('ru-RU')));
    return lines.join('\n');
}

function sendTelegram(payload, res) {
    const body = Buffer.from(payload, 'utf8');
    const req = https.request(
        'https://api.telegram.org/bot' + TOKEN + '/sendMessage',
        {
            method: 'POST',
            agent,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            },
            timeout: 60000
        },
        (tgRes) => {
            const chunks = [];
            tgRes.on('data', (c) => chunks.push(c));
            tgRes.on('end', () => {
                const out = Buffer.concat(chunks);
                res.writeHead(tgRes.statusCode || 502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(out.length ? out : JSON.stringify({ ok: false }));
            });
        }
    );
    req.on('timeout', () => {
        req.destroy(new Error('Telegram request timeout'));
    });
    req.on('error', (e) => {
        if (res.headersSent) return;
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
    });
    req.write(body);
    req.end();
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    if (!TOKEN || !CHAT_ID) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Telegram is not configured' }));
        return;
    }

    let raw = '';
    req.on('data', (chunk) => {
        raw += chunk;
        if (raw.length > 65536) {
            req.destroy();
        }
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(raw || '{}');

            let text;
            if (data.message) {
                text = String(data.message);
            } else {
                if (!data.name || !data.phone || String(data.phone).length < 6) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Invalid data' }));
                    return;
                }
                if (!data.city) {
                    data.city = DEFAULT_CITY;
                }
                text = buildStructuredMessage(data);
            }

            const payload = JSON.stringify({
                chat_id: CHAT_ID,
                text,
                parse_mode: 'HTML'
            });

            sendTelegram(payload, res);
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(
        '[tg-proxy] http://' + LISTEN_HOST + ':' + LISTEN_PORT +
            ' → Telegram via ' + PROXY_TYPE + ' ' + PROXY_HOST + ':' + PROXY_PORT
    );
});
