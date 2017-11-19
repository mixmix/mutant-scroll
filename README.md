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

- `classList` - (optional) an Array of classes to add to the final element
- `prepend`, `append` - (optional) supply array of html elements to insert before or after the streaming content.
- `streamToTop`, `streamToBottom` - (one required) at least one is required, is expected to be a pull-stream source.
- `render` - a function called on each item to render html
- `updateTop` - (optional) a function which is passed `(new, soFar)` where `new` is the incoming value from the top stream, and `soFar` is the scrollers observable Array of values, which you're expected to mutate.
- `updateBottom` - (optional) similar to updateTop
- `cb` - (optional) a callback called when errors happen
