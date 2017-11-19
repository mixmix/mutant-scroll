const pull = require('pull-stream')
const Pause = require('pull-pause')
const { h, Value, Array: MutantArray, map } = require('mutant')

const next = 'undefined' === typeof setImmediate ? setTimeout : setImmediate
const buffer = Math.max(window.innerHeight * 2, 1000)

const { assertScrollable, isBottom, isTop, isFilled, isVisible } = require('./utils')

module.exports = Scroller

// function Scroller(scroller, content, render, isPrepend, isSticky, cb) {
function Scroller(opts) {
  const {
    classList = [],
    prepend = [],
    append = [],
    streamToTop,
    streamToBottom,
    render,
    updateTop =  updateTopDefault,
    updateBottom = updateBottomDefault,
    cb = (err) => { if (err) throw err }
  } = opts

  function updateTopDefault (newItem, soFar) {
    soFar.insert(newItem, 0) 
  }

  function updateBottomDefault (newItem, soFar) {
    soFar.push(newItem) 
  }

  if (!streamToTop && !streamToBottom) throw new Error('Scroller requires a at least one stream: streamToTop || streamToBottom')
  if (!render) throw new Error('Scroller expects a render')

  const store = MutantArray()
  const content = h('section.content', map(store, render, { comparer: (a, b) => a === b }))
  const scroller = h('Scroller', { classList, style: { overflow: 'auto' } }, [
    h('div.wrapper', [
      h('section.top', prepend),
      content,
      h('section.bottom', append)
    ])
  ])
  assertScrollable(scroller)

  scroller.addEventListener('scroll', (ev) => {
    // this assumes the past is down and will be easier to reach isFilled == true by using streamToBottom
    if (isBottom(scroller, buffer) || !isFilled(content)) {
      bottom.pause.resume()
    }

    if (isTop(scroller, buffer)) {
      top.pause.resume()
    }
  })
    
  var top = {
    queue: [],
    pause: Pause(function () {})
  }
  var bottom = {
    queue: [],
    pause: Pause(function () {})
  }

  // var queueLengthTop = Value()
  // var queueLengthBottom = Value()

  //apply some changes to the dom, but ensure that
  //`element` is at the same place on screen afterwards.

  // function add () {
  //   if(queue.length) {
  //     var m = queue.shift()
  //     var r = render(m)
  //     append(scroller, content, r, isPrepend, isSticky)
  //     obv.set(queue.length)
  //   }
  // }
  //
  function addBottom () {
    if(bottom.queue.length) {
      var m = bottom.queue.shift()
      updateBottom(m, store)
      // queueLengthBottom.set(queue.bottom.length)
    }
  }


  top.pause.pause()
  bottom.pause.pause()

  //wait until the scroller has been added to the document
  next(function next () {
    if(scroller.parentElement) {
      top.pause.resume()
      bottom.pause.resume()
    }
    else setTimeout(next, 100)
  })

  pull(
    streamToBottom,
    bottom.pause,
    pull.drain(e => {
      bottom.queue.push(e)
      // queueLengthBottom.set(bottom.queue.length)

      if (isVisible(content)) {
        if (isBottom(scroller, buffer))
          addBottom()
      }
      else {
        if(scroller.scrollHeight < window.innerHeight && content.children.length < 10) {
          addBottom()
        }
      }

      if(bottom.queue.length > 5)
        bottom.pause.pause()

    }, (err) => {
      if(err) console.error(err)
      cb ? cb(err) : console.error(err)
    })
  )

  // var stream = pull(
  //   pause,
  //   pull.drain(function (e) {
  //     queue.push(e)
  //     obv.set(queue.length)

  //     if (isVisible(content)) {
  //       if (isEnd(scroller, buffer, isPrepend))
  //         add()
  //     }
  //     else {
  //       if(scroller.scrollHeight < window.innerHeight && content.children.length < 10) {
  //         add()
  //       }
  //     }

  //     if(queue.length > 5)
  //       pause.pause()

  //   }, function (err) {
  //     if(err) console.error(err)
  //     cb ? cb(err) : console.error(err)
  //   })
  // )

  // stream.visible = add
  // stream.observ = obv
  return scroller
}


function append(scroller, list, el, isPrepend, isSticky) {
  if(!el) return
  var s = scroller.scrollHeight
  var st = scroller.scrollTop
  if(isPrepend && list.firstChild)
    list.insertBefore(el, list.firstChild)
  else
    list.appendChild(el)

  //scroll down by the height of the thing added.
  //if it added to the top (in non-sticky mode)
  //or added it to the bottom (in sticky mode)
  if(isPrepend !== isSticky) {
    var d = (scroller.scrollHeight - s)
    var before = scroller.scrollTop
    //check whether the browser has moved the scrollTop for us.
    //if you add an element that is not scrolled into view
    //it no longer bumps the view down! but this check is still needed
    //for firefox.
    //this seems to be the behavior in recent chrome (also electron)
    if(st === scroller.scrollTop) {
      scroller.scrollTop = scroller.scrollTop + d
    }
  }
}






