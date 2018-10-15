/*
* @Author: shikar
* @Date:   2017-02-05 15:28:31
* @Last Modified by:   shikar
* @Last Modified time: 2017-05-01 03:00:38
*/
'use strict'
const querystring = require('querystring')
const got = require('got')
const safeEval = require('safe-eval')
const token = require('./token')
const languages = require('./languages')

function analysisObject(obj, ret = [], idx = 0) {
  let brCount = 0
  if (typeof obj === 'object') {
    for (let i in obj) {
      if (typeof obj[i] !== 'object') {
        ret.push(obj[i])
        brCount = (obj[i].split('\n')).length
        obj[i] = idx
        if (brCount > 1) {
          obj[i] = idx + '-' + ( idx + brCount )
          idx += brCount - 1
        }
        idx++
      } else {
        analysisObject(obj[i], ret, idx)
      }
    }
  }
  return ret
}

function recoverObject(obj, arr) {
  if (typeof obj === 'object') {
    for (let i in obj) {
      recoverObject(obj[i], arr)
      if (typeof obj[i] !== 'object') {
        if (obj[i].toString().indexOf('-') > -1) {
          let dis = obj[i].toString().split('-')
          obj[i] = arr.slice(dis[0], dis[1]).join('\n')
        } else {
          obj[i] = arr[obj[i]].replace(/^\s+|\s+$/gm,'')
        }
        
      }
    }
  }
}

function translate(input, opts = {}, domain='translate.google.cn') {
  let e
  [opts.from, opts.to].forEach(lang => {
    if (lang && !languages.isSupported(lang)) {
      e = new Error()
      e.code = 400
      e.message = 'The language \'' + lang + '\' is not supported'
    }
  })
  if (e) {
    return new Promise((resolve, reject) => {
      reject(e)
    })
  }

  opts.from = languages.getCode(opts.from || 'auto')
  opts.to = languages.getCode(opts.to || 'en')

  input = JSON.parse(JSON.stringify([input]))
  let text = analysisObject(input)
  text = text.join('\n')

  return token.get(text, domain).then(token => {
    let url = `https://${domain}/translate_a/single`
    let data = {
      client: 't',
      sl: opts.from,
      tl: opts.to,
      hl: opts.to,
      dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
      ie: 'UTF-8',
      oe: 'UTF-8',
      otf: 1,
      ssel: 0,
      tsel: 0,
      kc: 7,
      q: text
    }
    data[token.name] = token.value
    let query = querystring.stringify(data)
    if (query.length <= 1980) {
      return [url + '?' + query, null]
    } else {
      delete data.q
      return [url + '?' + querystring.stringify(data), {q: text}]
    }
  }).then(([url, post]) => {
    let opt = {}
    if (post) {
      opt = {body: post}
    }
    return got(url, opt).then(res => {
      let body = safeEval(res.body)
      let retString = ''
      
      body[0].forEach(obj => {
        if (obj[0]) {
          retString += obj[0]
        }
      })
      let result = retString.split('\n')

      recoverObject(input, result)
      return input[0]
    }).catch(err => {
      let e = new Error()
      if (err.statusCode !== undefined && err.statusCode !== 200) {
        e.code = 'BAD_REQUEST'
      } else {
        e.code = 'BAD_NETWORK'
      }
      e.message = err.message
      return e
    })
  })
}

module.exports = translate
module.exports.languages = languages
