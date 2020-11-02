const test = require ('ava')
import { map, prop } from 'ramda'
import { 
    mc, off, on, bpmChange, timeDivisionEvent, timingEvent 
  } from '../src/messages'
import { isNoteOn } from '../src/predicates/predicates.js'
import { isTimingEvent } from '../src/predicates/frmeta.js'
import { 
  timer, futureClock, metronome, clock 
  } from '../src/clock/clock.js'
import { from, merge, of } from 'rxjs'
import { filter as rxo_filter, take as rxo_take } from 'rxjs/operators'
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
      a: timingEvent (0, 150),
      b: timingEvent (10, 150),
      c: timingEvent (20, 150),
      d: timingEvent (30, 150),
      e: timingEvent (40, 150)
    }

    expectObservable (
      timer (10, 150, scheduler).pipe (rxo_take (5))
    ).toBe (expected, values)
  })

  scheduler = setup_scheduler (t)

  scheduler.run (({ expectObservable }) => {
    const expected = 'abcd(e|)'
    const values = {
      a: timingEvent (0, 75),
      b: timingEvent (1, 75),
      c: timingEvent (2, 75),
      d: timingEvent (3, 75),
      e: timingEvent (4, 75)
    }

    expectObservable (
      timer (1, 75, scheduler).pipe (rxo_take (5))
    ).toBe (expected, values)
  })
})

test ('timer second test', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run (({ expectObservable }) => {
    const expected = 'a 499ms b 499ms c 499ms d 499ms (e|)'
    const values = {
      a: timingEvent (0, 100),
      b: timingEvent (500, 100),
      c: timingEvent (1000, 100),
      d: timingEvent (1500, 100),
      e: timingEvent (2000, 100)
    }

    expectObservable (
      timer (500, 100, scheduler)
        .pipe (
          rxo_take (5))
    ).toBe (expected, values)
  })
})

// --------------------------------------------- Look ahead clock function

// 1 tick on 60 bpm = 1 tick every second (1000ms)
test ('futureClock: last_tick_time is null and look ahead window is less than ms_per_tick. Only first event (equal to now) should be generated.', (t) => {
  t.deepEqual (
    futureClock (1, 60, null, timingEvent (0, 10)),
    [[mc (0)], 0, 60])
})

test ('futureClock: last_tick_time is null and look ahead window is zero. No events should be generated.', (t) => {
  t.deepEqual (
    futureClock (1, 60, null, timingEvent (0, 0)),
    [[], 0, 60])
})

test ('futureClock: last_tick_time is 0 and look ahead window is less than ms_per_tick. No events should be generated.', (t) => {
  t.deepEqual (
    futureClock (1, 60, 0, timingEvent (0, 10)),
    [[], 0, 60])
})

test ('futureClock: last_tick_time is null and look ahead window is ms_per_tick x 2. Two events should be generated (including zero event).', (t) => {
  t.deepEqual (
    futureClock (1, 60, null, timingEvent (0, 2000)),
    [[mc (0), mc (1000)], 1000, 60])
})

test ('futureClock: last_tick_time is zero and look ahead window is equal to ms_per_tick x 2. One event (excluding zero event).', (t) => { 
  t.deepEqual (
    futureClock (1, 60, 0, timingEvent (0, 2000)),
    [[mc (1000)], 1000, 60])
})

test ('futureClock: last_tick_time is zero and look ahead window is bigger than ms_per_tick x 2 but smaller than ms_per_tick x 3. Two events should be generated (excluding zero event).', (t) => {
  t.deepEqual (
    futureClock (1, 60, 0, timingEvent (0, 2001)),
    [[mc (1000), mc (2000)], 2000, 60])
})

test ('futureClock: last_tick_time is 0, now is bigger than last_tick_time and look ahead window is exact to ms_per_tick. One event should be generated', (t) => {
  t.deepEqual (
    futureClock (1, 60, 0, timingEvent(500, 1000)),
    [[mc (1000)], 1000, 60])
})

// With a time division of 1000 and bpm of 60
// we get a MIDI Clock message every millisecond.
test ('futureClock: if last_tick_time is null, first event should occur exactly on now', (t) => {
  t.deepEqual (
     futureClock (1000, 60, null, timingEvent (0, 10)),
     [[mc (0), mc (1), mc (2), mc (3), mc (4), mc (5), 
       mc (6), mc (7), mc (8), mc (9)]
      , 9
      , 60])
})

test ('futureClock: if last tick time is not null, first event should not occur on last tick time but on last_tick_time + ms_per_tick', (t) => {
  t.deepEqual (
     futureClock (1000, 60, 0, timingEvent (0, 10)),
     [[mc (1), mc (2), mc (3), mc (4), mc (5), 
       mc (6), mc (7), mc (8), mc (9)]
      , 9
      , 60])
})

test ('futureClock: last tick time is after now but look ahead window expands after last tick time, some events should be generated', (t) => {
  t.deepEqual (
     futureClock (1000, 60, 150, timingEvent (145, 10)),
     [[mc (151), mc (152), mc (153), mc (154)], 
      154, 
      60])
})

test ('futureClock: last tick time is after now and look ahead window is smaller than the difference, no events should be generated', (t) => {
  t.deepEqual (
     futureClock (1000, 60, 155, timingEvent (145, 10)),
     [[], 155, 60])
})

test ('lookahead with advancing timing events', (t) => {
  t.deepEqual (
    futureClock (1, 60, null, timingEvent (0, 100)),
    [[mc (0)], 0, 60])

  t.deepEqual (
    futureClock (1, 60, 0, timingEvent (500, 100)),
    [[], 0, 60])

  t.deepEqual (
    futureClock (1, 60, 0, timingEvent (1000, 100)),
    [[mc (1000)], 1000, 60])

  t.deepEqual (
    futureClock (1, 60, 1000, timingEvent (1500, 100)),
    [[], 1000, 60])

  t.deepEqual (
    futureClock (1, 60, 1000, timingEvent (2000, 100)),
    [[mc (2000)], 2000, 60])
})

// --------------------------------------------------- MIDI Clock operator

test ('MIDI Clock operator, big look ahead window generates several midi clocks on one timing event', (t) => {
  var scheduler = setup_scheduler (t)

  scheduler.run ((helpers) => {
    const { expectObservable } = helpers
    const expected = '(abcde|)'
    const values = {
      a: mc (0), 
      b: mc (1000), 
      c: mc (2000), 
      d: mc (3000), 
      e: mc (4000)
    }

    expectObservable (
      timer (1, 5000, scheduler)
        .pipe (
          clock (60, 1),
          rxo_take (5))
    ).toBe (expected, values)
  })
})

test ('MIDI Clock operator, small look ahead window (but at clock times) generates one MIDI clock per timing event', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run ((helpers) => {
    const { expectObservable } = helpers
    const expected = 'a 999ms b 999ms c 999ms d 999ms (e|)'
    const values = {
      a: mc (0),
      b: mc (1000),
      c: mc (2000),
      d: mc (3000),
      e: mc (4000)
    }

    expectObservable (
      timer (500, 100, scheduler)
        .pipe (
          clock (60, 1),
          rxo_take (5))
    ).toBe (expected, values)
  })
})

test ('MIDI Clock operator should forward not timing events', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run (({ expectObservable }) => {
    const expected = '(ab|)'
    const values = {
      a: on (64),
      b: on (72)
    }

    expectObservable (
      of (on (64), on (72)).pipe (
        clock (60, 1),
        rxo_take (2)
    )).toBe (expected, values)
  })
})

test ('MIDI Clock should accept tempo change messages and modify the rate of MIDI Clock messages sent', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      'a 499ms b 499ms c 499ms d 499ms ef 498ms g 499ms h',
      {
        a: timingEvent (0, 150),
        b: timingEvent (500, 150),
        c: timingEvent (1000, 150),
        d: timingEvent (1500, 150),
        e: timingEvent (2000, 150),
        f: bpmChange (120),
        g: timingEvent (2500, 150),
        h: timingEvent (3000, 150)
      })
    const expected = 'a 999ms b 999ms cd 498ms e 499ms f'
    const values = {
      a: mc (0),
      b: mc (1000),
      c: mc (2000),
      d: bpmChange (120),
      e: mc (2500),
      f: mc (3000)
    }

    expectObservable (
      source.pipe (clock (60, 1))
    ).toBe (expected, values)
  })
})

test ('MIDI Clock should accept TimeDivision frMIDI meta messages to change its defined time division', (t) => {
  let scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      'a 499ms b 499ms c 499ms d 499ms ef 498ms g 499ms h',
      {
        a: timingEvent (0, 150),
        b: timingEvent (500, 150),
        c: timingEvent (1000, 150),
        d: timingEvent (1500, 150),
        e: timingEvent (2000, 150),
        f: timeDivisionEvent (2),
        g: timingEvent (2500, 150),
        h: timingEvent (3000, 150)
      })
    const expected = 'a 999ms b 999ms cd 498ms e 499ms f'
    const values = {
      a: mc (0),
      b: mc (1000),
      c: mc (2000),
      d: timeDivisionEvent (2),
      e: mc (2500),
      f: mc (3000)
    }

    expectObservable (
      source.pipe (clock (60, 1))
    ).toBe (expected, values)
  })
})

//test ('metronome', (t) => {
//  let scheduler = setup_scheduler (t)
//
//  scheduler.run (({ cold, expectObservable }) => {
//    const source = cold (
//      'abcd',
//      {
//        a: mc (0),
//        b: mc (500),
//        c: mc (1000),
//        d: mc (1500)
//      })
//
//    const expected = 'abc(d|)'
//    const values = {
//      a: on (48, 96, 9, 0),
//      b: on (38, 96, 9, 500),
//      c: on (51, 96, 9, 1000),
//      d: on (38, 96, 9, 1500)
//    }
//
//    expectObservable (
//      source.pipe (
//        metronome (2, 2, 2),
//        rxo_filter (isNoteOn),
//        rxo_take (4)
//      )
//    ).toBe (expected, values)
//  })
//})
