const test = require('ava')
const languages = require('./languages')
const translate = require('./index')

test('translate with string', async t => {
  try {
    const res = await translate('你好')
    t.is(res, 'Hello there')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with array', async t => {
  try {
    const res = await translate(['你好', '你好'])
    t.is(res[0], 'Hello there')
    t.is(res[1], 'Hello there')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with object', async t => {
  try {
    const res = await translate({a: '你好', b: '你好'})
    t.is(res.a, 'Hello there')
    t.is(res.b, 'Hello there')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with full object', async t => {
  try {
    const obj = { a: 1, b: '1', c: "How are you?\nI'm nice.", d: [true, 'true', 'hi', { a: 'hello', b: ['world']}] }
    const res = await translate(obj, {from: 'en', to: 'zh-cn'})
    t.is(res.a, 1)
    t.is(res.b, '1')
    t.is(res.c, '你好吗？\n我很好。')
    t.is(res.d[0], true)
    t.is(res.d[1], 'true')
    t.is(res.d[2], '嗨')
    t.is(res.d[3].a, '你好')
    t.is(res.d[3].b[0], '世界')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with array and object', async t => {
  try {
    const res = await translate({a: '你好', b: ['你好', '你好']})
    t.is(res.a, 'Hello there')
    t.is(res.b[0], 'Hello there')
    t.is(res.b[1], 'Hello there')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with \\n', async t => {
  try {
    const res = await translate({a: '你\n好', b: ['你\n好', '你好']})
    t.is(res.a, 'you\nit is good')
    t.is(res.b[0], 'you\nit is good')
    t.is(res.b[1], 'Hello there')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with except', async t => {
  try {
    const res = await translate({a: '你\n好', b: ['你\n好', '你好']}, {except:['a']})
    t.is(res.a, '你\n好')
    t.is(res.b[0], 'you\nit is good')
    t.is(res.b[1], 'Hello there')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('translate with option', async t => {
  try {
    const res = await translate('Hello', {from: 'en', to: 'zh-cn'})
    t.is(res, '你好')
  } catch (err) {
    t.log(err)
    t.fail()
  }
})

test('test a supported language – by code', t => {
  t.true(languages.isSupported('en'))
})

test('test an unsupported language – by code', t => {
  t.false(languages.isSupported('js'))
})
