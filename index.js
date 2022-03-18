
'use strict';

const _ = require("lodash");
const got = require('got');
const userAgents = require("user-agents");
const token = require('./token');
const languages = require('./languages');

function isKeyword(keyword) {
  const reservedKeywords = ['abstract', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'];

  return reservedKeywords.includes(keyword);
}

function isNumber(n) {
  var type = typeof n;

  if (type !== 'string' && type !== 'number'){
    return false;
  }

  if (type === 'string'){
    n = n.replace(/[,|.]/g, '');
    if (n.trim() === ''){
      return false;
    } else {
      n = +n;
    }
  }

  return typeof n === 'number' && n - n < 1;
}

function isUrl(u) {
  try {
    new URL(u);
  } catch {
    return false;
  }

  return true;
}

function checkSame(v, maps) {
  for (const idx in maps) {
    if (maps[idx].v === v) {
      return idx
    }
  }
  return -1
}

function enMap(obj, except=[], path='', map=[]) {
  if (_.isObject(obj) == true) {
    _.forEach(obj, (v, k) => {
      const furKeyStr = _.isNumber(k) ? `[${k}]` : ( path && '.' ) + k
      const curPath = path + furKeyStr
      if (_.isObject(v) == true) {
        enMap(v, except, curPath, map)
      } else {
        const exceptReg = except.length > 0 ? new RegExp(`(^|\\.)(${_.map(except, _.escapeRegExp).join('|')})(\\.|\\[|$)`, 'i') : false
        if (
          _.isString(v) &&
          !isNumber(v) &&
          !isUrl(v) &&
          !isKeyword(v) &&
          !/^(?!([a-z]+|\d+|[\?=\.\*\[\]~!@#\$%\^&\(\)_+`\/\-={}:";'<>,]+)$)[a-z\d\?=\.\*\[\]~!@#\$%\^&\(\)_+`\/\-={}:";'<>,]+$/i.test(v) &&
          (!exceptReg || !exceptReg.test(curPath))
        ) {
          const idx = checkSame(v, map)
          if (idx > -1) {
            map.splice(idx+1, 0, {
              p: curPath,
              v: v,
              i: map[idx].i,
              l: map[idx].l,
              s: true
            })
          } else {
            const lastMap = _.last(map)
            map.push({
              p: curPath,
              v: v,
              i: lastMap ? lastMap.i + lastMap.l : 0,
              l: v.split("\n").length,
              s: false
            })
          }
        }
      }
    })
  } else {
    map.push({
      p: '',
      v: obj,
      i: 0,
      l: obj.split("\n").length
    })
  }
  return map
}

function deMap(src, maps, dest) {
  if (_.isObject(src) == true) {
    src = _.clone(src)
    dest = dest.split("\n")
    for (const map of maps) {
      _.set(src, map.p, _.slice(dest, map.i, map.i+map.l).join("\n"))
    }
  } else {
    src = dest
  }
  return src
}

async function translate(input, opts = {}, domain='translate.google.cn') {
  const langs = [opts.from, opts.to]
  const except = opts.except || []
  input = _.cloneDeep(input)
  for (const lang of langs) {
    if (lang && !languages.isSupported(lang)) {
      const e = new Error('The language \'' + lang + '\' is not supported')
      e.code = 400
      throw e
    }
  }

  opts.from = languages.getCode(opts.from || 'auto')
  opts.to = languages.getCode(opts.to || 'en')

  const strMap = enMap(input, except)
  const text = _.map(_.differenceBy(strMap, [{ s: true }], 's'), 'v').join("\n")
  const tokenRet = await token.get(text, domain)
  const url = `https://${domain}/translate_a/single`
  const searchParams = new URLSearchParams([
    ['client', 't'],
    ['sl', opts.from],
    ['tl', opts.to],
    ['hl', opts.to],
    ['dt', 'at'], ['dt', 'bd'], ['dt', 'ex'], ['dt', 'ld'], ['dt', 'md'], ['dt', 'qca'], ['dt', 'rw'], ['dt', 'rm'], ['dt', 'ss'], ['dt', 't'],
    ['ie', 'UTF-8'],
    ['oe', 'UTF-8'],
    ['otf', 1],
    ['ssel', 0],
    ['tsel', 0],
    ['kc', 7],
    ['q', text],
    [tokenRet.name, tokenRet.value]
  ])
  const opt = { responseType: 'json', headers: {'User-Agent': new userAgents({ deviceCategory: 'desktop' }).toString()} }
  if (searchParams.toString().length <= 1980) {
    opt.method = 'GET'
  } else {
    searchParams.delete('q')
    opt.method = 'POST'
    opt.form = { q: text }
  }
  opt.searchParams = searchParams
  try {
    const { body } = await got(url, opt)
    const retString = _.map(body[0], 0).join('')
    return deMap(input, strMap, retString)
  } catch (error) {
    let e = new Error(error.message)
    if (error.statusCode !== undefined && error.statusCode !== 200) {
      e.code = 'BAD_REQUEST'
    } else {
      e.code = 'BAD_NETWORK'
    }
    throw e
  }
}

module.exports = translate
module.exports.languages = languages
