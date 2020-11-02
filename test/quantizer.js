const test = require ('ava')

import { quantizer } from '../src/clock/quantizer.js'
import { mc, on } from '../src/messages/messages.js'
import { TestScheduler } from 'rxjs/testing'
import { assoc } from 'ramda'

const setup_scheduler = (t) =>
  new TestScheduler ((actual, expected) => {
    t.deepEqual (actual, expected)
  })

test ('quantizer', (t) => {
  const scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      '               a---bc--d--ef-g-h---(ij)',
      {
        a: mc (0),
        b: mc (1),
        c: on (64, 96, 0, 1.25, 0),
        d: mc (2),
        e: on (67, 96, 0, 2.75, 0),
        f: mc (3),
        g: on (71, 96, 0, 3.5, 0),
        h: mc (4),
        i: on (75, 96, 0, 5, 0),
        j: mc (5)
      })

    const expected = 'a---bc--d--ef-g-h---(ij)'
    const values = {
      a: mc (0),
      b: mc (1),
      c: assoc ('quantizedTimeStamp') (1) (on (64, 96, 0, 1.25, 0)),
      d: mc (2),
      e: assoc ('quantizedTimeStamp') (3) (on (67, 96, 0, 2.75, 0)),
      f: mc (3),
      g: assoc ('quantizedTimeStamp') (3) (on (71, 96, 0, 3.5, 0)),
      h: mc (4),
      i: assoc ('quantizedTimeStamp') (5) (on (75, 96, 0, 5, 0)),
      j: mc (5)
    }

    expectObservable (
      source.pipe (quantizer ())
    ).toBe (expected, values)
  })
})
