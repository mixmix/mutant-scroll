const pull = require('pull-stream')
pull.pause = require('pull-pause')
const { h, Array: MutantArray, map } = require('mutant')
const throttle = require('lodash.throttle')

const next = typeof setImmediate === 'undefined' ? setTimeout : setImmediate

const { assertScrollable, isBottom, isTop, isFilled, isVisible } = require('./utils')

const HEIGHT_BUFFER = Math.max(window.innerHeight * 1.6, 1000)
const QUEUE_SIZE = 10

module.exports = function Scroller (opts) {
  const {
    classList = [],
    prepend = [],
    append = [],
    streamToTop = pull.empty(),
    streamToBottom = pull.empty(),
    render,
    comparer = (a, b) => a === b,
    updateTop = (soFar, newItem) => { soFar.insert(newItem, 0) },
    updateBottom = (soFar, newItem) => { soFar.push(newItem) },
    store = MutantArray(),
    cb = (err) => { if (err) throw err },
    overflowY = 'scroll'
  } = opts

  if (!render) throw new Error('Scroller requires a render function')

  const content = h('section.content', map(store, render, { comparer }))
  const scroller = h('Scroller', { classList, style: { 'overflow-y': overflowY } }, [
    h('section.top', prepend),
    content,
    h('section.bottom', append)
  ])
  assertScrollable(scroller)

  scroller.addEventListener('scroll', throttle(onScroll, 1000))
  function onScroll () {
    moreBottom()
    moreTop()

    function moreBottom () {
      if (isBottom(scroller, HEIGHT_BUFFER)) {
        addBottom()
        setTimeout(moreBottom, 200)
      }
    }

    function moreTop () {
      if (isTop(scroller, HEIGHT_BUFFER)) {
        addTop()
        setTimeout(moreTop, 200)
      }
    }
  }

  var top = {
    queue: [],
    stream: pull.pause(function () {})
  }

  var bottom = {
    queue: [],
    stream: pull.pause(function () {})
  }

  function addBottom () {
    if (bottom.queue.length) {
      var m = bottom.queue.shift()
      updateBottom(store, m)
    }

    if (bottom.queue.length < QUEUE_SIZE) {
      bottom.stream.resume()
    }
  }

  function addTop () {
    if (top.queue.length) {
      var sh = scroller.scrollHeight
      var st = scroller.scrolltop

      var m = top.queue.shift()
      updateTop(store, m)
      // scroll down by the height of the thing added.

      // NOTE - this is no longer an appendChild, we have to wait for mutant to map the new piece into place
      // might be a problem with detecting the need to change height

      var d = (scroller.scrollHeight - sh)
      // check whether the browser has moved the scrollTop for us.
      // if you add an element that is not scrolled into view
      // it no longer bumps the view down! but this check is still needed
      // for firefox.
      // this seems to be the behavior in recent chrome (also electron)
      if (st === scroller.scrollTop) {
        scroller.scrollTop = scroller.scrollTop + d
      }
    }

    if (top.queue.length < QUEUE_SIZE) {
      top.stream.resume()
    }
  }

  pull(
    streamToBottom,
    bottom.stream,
    pull.drain(e => {
      bottom.queue.push(e)

      if (bottom.queue.length >= QUEUE_SIZE) bottom.stream.pause()
    }),
    (err) => {
      if (err) console.error(err)
      cb ? cb(err) : console.error(err)
    }
  )

  pull(
    streamToTop,
    top.stream,
    pull.drain(e => {
      top.queue.push(e)

      if (top.queue.length >= QUEUE_SIZE) top.stream.pause()
    }, (err) => {
      if (err) console.error(err)
      cb ? cb(err) : console.error(err)
    })
  )

  // wait until the scroller has been added to the document
  next(function start () {
    if (!scroller.parentElement) return setTimeout(start, 100)

    fillPage()
  })

  function fillPage () {
    if (!isVisible(content)) return setTimeout(fillPage, 100)

    addBottom()
    addTop()

    if (!isFilled(scroller)) {
      if (bottom.queue.length || top.queue.length) setTimeout(fillPage, 100)
      else setTimeout(fillPage, 1000)
    }
  }

  return scroller
}
