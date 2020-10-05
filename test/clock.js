const test = require ('ava')
import { map, prop } from 'ramda'
import { mc } from '../src/messages'
import { 
  createTimer, lookAheadClock, MIDIClock 
  } from '../src/clock/clock.js'
import { of } from 'rxjs'
import { take } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'

const setup_scheduler = (t) =>
  new TestScheduler ((actual, expected) => {
    t.deepEqual (actual, expected)
  })

test ('create timer', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run (({ expectObservable }) => {
    const expected = 'a 9ms b 9ms c 9ms d 9ms (e|)'
    const values = {
      a: [0, 150],
      b: [10, 150],
      c: [20, 150],
      d: [30, 150],
      e: [40, 150]
    }

    expectObservable (
      createTimer (10, 150, scheduler).pipe (take (5))
    ).toBe (expected, values)
  })

  scheduler = setup_scheduler (t)

  scheduler.run (({ expectObservable }) => {
    const expected = 'abcd(e|)'
    const values = {
      a: [0, 75],
      b: [1, 75],
      c: [2, 75],
      d: [3, 75],
      e: [4, 75]
    }

    expectObservable (
      createTimer (1, 75, scheduler).pipe (take (5))
    ).toBe (expected, values)
  })
})

// --------------------------------------------- Look ahead clock function

// 1 tick on 60 bpm = 1 tick every second (1000ms)
test ('lookAheadClock: last_tick_time is null and look ahead window is less than ms_per_tick. Only first event (equal to now) should be generated.', (t) => {
  t.deepEqual (
    lookAheadClock (1, 60, null, 0, 10),
    [[mc (0)], 0])
})

test ('lookAheadClock: last_tick_time is null and look ahead window is zero. No events should be generated.', (t) => {
  t.deepEqual (
    lookAheadClock (1, 60, null, 0, 0),
    [[], 0])
})

test ('lookAheadClock: last_time_time is 0 and look ahead window is less than ms_per_tick. No events should be generated.', (t) => {
  t.deepEqual (
    lookAheadClock (1, 60, 0, 0, 10),
    [[], 0])
})

test ('lookAheadClock: last_tick_time is null and look ahead window is ms_per_tick x 2. Two events should be generated (including zero event).', (t) => {
  t.deepEqual (
    lookAheadClock (1, 60, null, 0, 2000),
    [[mc (0), mc (1000)], 1000])
})

test ('lookAheadClock: last_tick_time is zero and look ahead window is equal to ms_per_tick x 2. One event (excluding zero event).', (t) => { 
  t.deepEqual (
    lookAheadClock (1, 60, 0, 0, 2000),
    [[mc (1000)], 1000])
})

test ('lookAheadClock: last_tick_time is zero and look ahead window is bigger than ms_per_tick x 2 but smaller than ms_per_tick x 3. Two events should be generated (excluding zero event).', (t) => {
  t.deepEqual (
    lookAheadClock (1, 60, 0, 0, 2001),
    [[mc (1000), mc (2000)], 2000])
})

test ('lookAheadClock: last_tick_time is 0, now is bigger than last_tick_time and look ahead window is exact to ms_per_tick. One event after last_tick_time should be generated.', (t) => {
  t.deepEqual (
    lookAheadClock (1, 60, 0, 500, 1000),
    [[mc (1000)], 1000])
})

// With a time division of 1000 and bpm of 60
// we get a MIDI Clock message every millisecond.
test ('lookAheadClock: if last_tick_time is null, first event should occur exactly on now', (t) => {
  t.deepEqual (
     lookAheadClock (1000, 60, null, 0, 10),
     [[mc (0), mc (1), mc (2), mc (3), mc (4), mc (5), 
       mc (6), mc (7), mc (8), mc (9)]
      , 9])
})

test ('lookAheadClock: if last tick time is not null, first event should not occur on last tick time but on last_tick_time + ms_per_tick', (t) => {
  t.deepEqual (
     lookAheadClock (1000, 60, 0, 0, 10),
     [[mc (1), mc (2), mc (3), mc (4), mc (5), 
       mc (6), mc (7), mc (8), mc (9)]
      , 9])
})

test ('lookAheadClock: last tick time is after now but look ahead window expands after last tick time, some events should be generated', (t) => {
  t.deepEqual (
     lookAheadClock (1000, 60, 150, 145, 10),
     [[mc (151), mc (152), mc (153), mc (154)], 154])
})

test ('lookAheadClock: last tick time is after now and look ahead window is smaller than the difference, no events should be generated', (t) => {
  t.deepEqual (
     lookAheadClock (1000, 60, 155, 145, 10),
     [[], 155])
})

// --------------------------------------------------- MIDI Clock operator

test ('MIDI Clock operator, array of midi clock messages', (t) => {
  var scheduler = setup_scheduler (t)

  scheduler.run ((helpers) => {
    const { expectObservable } = helpers
    const expected = '(a|)'
    const values = {
      a: [mc (0), mc (1000), mc (2000), mc (3000), mc (4000)],
    }

    expectObservable (
      createTimer (1, 5000, scheduler)
        .pipe (
          MIDIClock (1, 60, scheduler.now), 
          take (1))
    ).toBe (expected, values)
  })
})

test ('MIDI Clock operator, arrays of midi clock messages', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run ((helpers) => {
    const { expectObservable } = helpers
    const expected = 'a 999ms b 999ms c 999ms d 999ms (e|)'
    const values = {
      a: [mc (0)],
      b: [mc (1000)],
      c: [mc (2000)],
      d: [mc (3000)], 
      e: [mc (4000)]
    }

    expectObservable (
      createTimer (500, 100, scheduler)
        .pipe (
          MIDIClock (1, 60, scheduler.now), 
          take (5))
    ).toBe (expected, values)
  })
})

//test ('Not overlaping timer windows should create MIDI clocks in the past', (t) => {
//  let scheduler = setup_scheduler (t) 
//
//  scheduler.run ((helpers) => {
//    const { expectObservable } = helpers
//    const expected = 'abcde
//})
