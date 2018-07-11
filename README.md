# Mutant-scroll

An infinite scroller for [mutant](https://github.com/mmckegg/mutant), fed by pull-streams. Heavily inspired by [pull-scroll](https://github.com/dominictarr/pull-scroll).

## Example

```js
const Scroller = require('mutant-scroll')

const scollableContainer = Scroller({
  streamToTop,
  streamToBottom,
  render
})

// => mutant html element <div class='Scroller'>
```

## API

Keys you can provide mutant-scroll: 

- `render` - a function called on each item to render html
- `streamToTop`, `streamToBottom` - (one required) at least one is required, is expected to be a pull-stream source.
- `classList` - (optional) an Array of classes to add to the final element
- `prepend`, `append` - (optional) supply array of html elements to insert before or after the streaming content.
- `updateTop` - (optional) a function which is passed `(soFar, new)` where `new` is the incoming value from the top stream, and `soFar` is the scrollers observable Array of values, which you're expected to mutate.
- `updateBottom` - (optional) similar to updateTop
- `store` - (optional) supply a `mutant/array` if you want to have external access to it, e.g. for caching
- `comparer` - (optional) a function used for the mutant map to compare those things it's rendering over
- `overflowY` - (optional) over-ride the default inline style over overflow-y
- `cb` - (optional) a callback called when errors happen
