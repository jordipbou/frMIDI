const test = require ('ava')
import { meter, metronome } from '../../src/sequences/metronome.js'
import { mc, on } from '../../src/messages/messages.js'
import { endOfTrack } from '../../src/messages/meta.js'
import { 
    barEvent, beatEvent, restEvent, subdivisionEvent 
  } from '../../src/messages/frmeta.js'
import { deltaTime } from '../../src/lenses/lenses.js'
import { set } from 'ramda'
import { setup_scheduler } from './sequences.js'

test ('meter', (t) => {
  const scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      '               a---b---c---d',
      {
        a: mc (0),
        b: mc (500),
        c: mc (1000),
        d: mc (1500)
      })

    const expected = '(ab)(cd)(ef)(gh)'
    const values = {
      a: mc (0),
      b: barEvent (0),
      c: mc (500),
      d: subdivisionEvent (500),
      e: mc (1000),
      f: beatEvent (1000),
      g: mc (1500),
      h: subdivisionEvent (1500)
    }

    expectObservable (
      source.pipe (meter (2) ([1, 3], [2, 3]))
    ).toBe (expected, values)
  })
})

test ('metronome', (t) => {
  const scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      '               a---b---c---d',
      {
        a: mc (0),
        b: mc (500),
        c: mc (1000),
        d: mc (1500)
      })

    const expected = '(ab)(cd)(ef)(gh)'
    const values = {
      a: mc (0),
      b: on (48, 96, 9, 0),
      c: mc (500),
      d: on (38, 96, 9, 500),
      e: mc (1000),
      f: on (51, 96, 9, 1000),
      g: mc (1500),
      h: on (38, 96, 9, 1500)
    }

    expectObservable (
      source.pipe (metronome (2) ([1, 3], [2, 3]))
    ).toBe (expected, values)
  })
})
