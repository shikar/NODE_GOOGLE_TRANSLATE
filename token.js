'use strict';

const got = require('got');
const Configstore = require('configstore');
const config = new Configstore('google-translate');

const win = {
    TKK: config.get('TKK') || '0',
};

let yr = null;

function wr(a) {
    return () => {
        return a;
    };
}

function xr(a, b) {
    let d;

    for (let c = 0; c < b.length - 2; c += 3) {
        d = b.charAt(c + 2);
        d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d);
        d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
        a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d;
    }

    return a;
}

function sM(a) {
    let b;
    let c;
    let d;
    let e = [];
    let f = 0;

    if (yr !== null) {
        b = yr;
    } else {
        b = wr(String.fromCharCode(84));
        c = wr(String.fromCharCode(75));
        b = [b(), b()];
        b[1] = c();
        b = (yr = win[b.join(c())] || "") || "";
    }

    d = wr(String.fromCharCode(116));
    c = wr(String.fromCharCode(107));
    d = [d(), d()];

    d[1] = c();
    c = "&" + d.join("") + "=";
    d = b.split(".");
    b = Number(d[0]) || 0;

    for (let g = 0; g < a.length; g++) {
        let l = a.charCodeAt(g);

        if (l < 128) {
            e[f++] = l;
        } else {
            if (l < 2048) {
                e[f++] = l >> 6 | 192;
            } else {
                if (
                    55296 == (l & 64512) &&
                    g + 1 < a.length &&
                    56320 == a.charCodeAt(g + 1) & 64512
                ) {
                    l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023);
                    e[f++] = l >> 18 | 240;
                    e[f++] = l >> 12 & 63 | 128;
                } else {
                    e[f++] = l >> 12 | 224;
                }

                e[f++] = l >> 6 & 63 | 128;
            }

            e[f++] = l & 63 | 128;
        }
    }

    a = b;

    for (f = 0; f < e.length; f++) {
        a += e[f];
        a = xr(a, "+-a^+6");
    }

    a = xr(a, "+-3^+b+-f");
    a ^= Number(d[1]) || 0;
    0 > a && (a = (a & 2147483647) + 2147483648);
    a %= 1E6;

    return c + (a.toString() + "." + (a ^ b));
}

async function updateTKK(domain) {
    const now = Math.floor(Date.now() / 3600000);

    if (Number(win.TKK.split('.')[0]) === now) {
        return;
    } else {
        try {
            const res = await got(`https://${domain}`);
            const code = res.body.match(/tkk:\'(.*?)\'/ig);
            if (code) {
                const TKK = code[0].match(/\d+\.\d+/)[0];
                if (typeof TKK !== 'undefined') {
                    config.set('TKK', TKK);
                }
            }

            return;
        } catch (error) {
            error.code = 'BAD_NETWORK';
            throw error;
        }
    }
}

async function get(text, domain='translate.google.com') {
    try {
        await updateTKK(domain);

        return {
            name: 'tk',
            value: sM(text).replace('&tk=', ''),
        };
    } catch (error) {
        throw error;
    }
}

module.exports.get = get;
