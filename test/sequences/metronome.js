const test = require ('ava')
import { meterPattern, meter } from '../../src/sequences/metronome.js'
import { mc } from '../../src/messages/messages.js'
import { endOfTrack } from '../../src/messages/meta.js'
import { 
    barEvent, beatEvent, restEvent, subdivisionEvent 
  } from '../../src/messages/frmeta.js'
import { deltaTime } from '../../src/lenses/lenses.js'
import { set } from 'ramda'
import { setup_scheduler } from './sequences.js'

//test ('meterPattern', (t) => {
//  t.deepEqual (
//    meterPattern ([1, 3], [2, 3]),
//    [
//      [
//        set (deltaTime) (0) (barEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (beatEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (endOfTrack ())
//      ],
//      2
//    ])
//})
//
//test ('meterPattern 2', (t) => {
//  t.deepEqual (
//    meterPattern ([1, 3, 3], [2, 3, 3], [2, 3, 2], [3, 2, 3]),
//    [
//      [
//        set (deltaTime) (0) (barEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (beatEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (beatEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (beatEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (beatEvent ()),
//        set (deltaTime) (1) (subdivisionEvent ()),
//        set (deltaTime) (1) (endOfTrack ())
//      ],
//      3
//    ])
//})

//test ('meter', (t) => {
//  let scheduler = setup_scheduler (t)
//
//  scheduler.run (({ cold, expectObservable }) => {
//    const source = cold (
//      '               a---b---c---d',
//      {
//        a: mc (0),
//        b: mc (500),
//        c: mc (1000),
//        d: mc (1500)
//      })
//
//    const expected = '(ab)(cd)(ef)(gh)'
//    const values = {
//      a: mc (0),
//      b: barEvent (0),
//      c: mc (500),
//      d: subdivisionEvent (500),
//      e: mc (1000),
//      f: beatEvent (1000),
//      g: mc (1500),
//      h: subdivisionEvent (1500)
//    }
//
//    expectObservable (
//      source.pipe (meter ([1, 2, 1, 2], 5))
//    ).toBe (expected, values)
//  })
//})
