const test = require ('ava')
import { 
  isNoteOn, isNoteOff, seemsMessage 
} from '../../src/predicates'
import { 
  cc, on, off, mc, pp, start, stop, cont 
} from '../../src/messages/messages.js'
import { endOfTrack } from '../../src/messages/meta.js'
import { emptyEvent, sequenceEvent } from '../../src/messages/frmeta.js'
import { 
  time, deltaTime, note, timeStamp
} from '../../src/lenses/lenses.js'
import { 
  adjustTrack, createSequence, createLoop, 
  delayEventsIf, delayHeadEvents, dropEvents,
  filterEvents, getTrack, groupByTime, insertEvent, insertAllEvents,
  mapEvents, mapTrackEvents, mapTracks, mergeTracks, 
  rejectEvents, seemsTrack, seemsSequence, sortEvents, setTimeDivision,
  addTime, withoutTime, addDeltaTime, withoutDeltaTime
} from '../../src/sequences/sequences.js'
import { multiSet } from '../../src/utils.js'
import { 
  all, assoc, dissoc, drop, head, identical, is, 
  last, map, prepend, set, take, view 
} from 'ramda'
import { TestScheduler } from 'rxjs/testing'

// ------------------------- Test Helpers --------------------------------

export const setup_scheduler = (t) =>
  new TestScheduler ((actual, expected) => {
    t.deepEqual (actual, expected)
  })

export const sequence = {
  formatType: 1,
  timeDivision: 1,
  tracks: [
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (off (64)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (off (67)),
        set (deltaTime) (1) (on (71)),
        set (deltaTime) (3) (off (71)),
        set (deltaTime) (2) (endOfTrack ())
    ],
    [
        set (deltaTime) (0) (on (32)),
        set (deltaTime) (8) (off (32)),
        set (deltaTime) (1) (endOfTrack ())
    ]
  ]
}

// -------------------------- Predicates ---------------------------------

test ('seemsSequence', (t) => {
  t.true (seemsSequence (sequence))
  t.false (seemsSequence (sequence.tracks [0]))
})

test ('seemsTrack', (t) => {
  t.true (seemsTrack (sequence.tracks [0]))
  t.false (seemsTrack (sequence))
})

// ---------------- Operations on tracks and events ----------------------

test ('mapTracks', (t) => {
  t.deepEqual (
    mapTracks (take (1)) (sequence),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
            set (deltaTime) (0) (on (64)),
        ],
        [
            set (deltaTime) (0) (on (32)),
        ]
      ]
    })
})

test ('mapEvents', (t) => {
  t.deepEqual (
    mapEvents (set (deltaTime) (1)) (sequence),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
            set (deltaTime) (1) (on (64)),
            set (deltaTime) (1) (off (64)),
            set (deltaTime) (1) (on (67)),
            set (deltaTime) (1) (off (67)),
            set (deltaTime) (1) (on (71)),
            set (deltaTime) (1) (off (71)),
            set (deltaTime) (1) (endOfTrack ())
        ],
        [
            set (deltaTime) (1) (on (32)),
            set (deltaTime) (1) (off (32)),
            set (deltaTime) (1) (endOfTrack ())
        ]
      ]
    })
})

test ('getTrack', (t) => {
  t.deepEqual (
    getTrack (0) (sequence),
    sequence.tracks [0]
  )
})

// ------------------------------ Set time -------------------------------

test ('add time to single message', (t) => {
  t.deepEqual (
    addTime (set (deltaTime) (0) (on (64)), 0),
    [
      0, 
      assoc 
        ('time') 
        (0) 
        (set (deltaTime) (0) (on (64)))])

  t.deepEqual (
    addTime (set (deltaTime) (0) (on (64)), 150),
    [
      150, 
      assoc 
        ('time') 
        (150) 
        (set (deltaTime) (0) (on (64)))])

  t.deepEqual (
    addTime (set (deltaTime) (15) (on (64, 96)), 150),
    [
      165, 
      assoc 
        ('time') 
        (165) 
        (set (deltaTime) (15) (on (64, 96)))])
})

test ('addTime (one track)', (t) => {
  const modified = addTime (sequence.tracks [0])

  t.true (seemsTrack (modified))
  t.not (modified, sequence.tracks [0])

  t.is (modified.length, 7)
  t.is (modified [0].time, 0)
  t.is (modified [1].time, 1)
  t.is (modified [2].time, 1)
  t.is (modified [3].time, 3)
  t.is (modified [4].time, 4)
  t.is (modified [5].time, 7)
  t.is (modified [6].time, 9)
})

test ('addTime (one track) should be idempotent', (t) => {
  t.deepEqual (
    addTime (sequence.tracks [0]),
    addTime (
      addTime (sequence.tracks [0])))
})

test ('addTime (on multiple tracks)', (t) => {
  let modified = addTime (sequence)

  t.true (seemsSequence (modified))
  t.not (modified.tracks, sequence.tracks)
  t.not (modified.tracks [0], sequence.tracks [0])
  t.not (modified.tracks [1], sequence.tracks [1])

  let track = modified.tracks [0]

  t.is (track.length, 7)
  t.is (track [0].time, 0)
  t.is (track [1].time, 1)
  t.is (track [2].time, 1)
  t.is (track [3].time, 3)
  t.is (track [4].time, 4)
  t.is (track [5].time, 7)
  t.is (track [6].time, 9)

  let track1 = modified.tracks [1]

  t.is (track1.length, 3)
  t.is (track1 [0].time, 0)
  t.is (track1 [1].time, 8)
  t.is (track1 [2].time, 9)
})

test ('addTime (sequence) should be idempotent', (t) => {
  t.deepEqual (
    addTime (sequence),
    addTime (addTime (sequence)))
})

test ('withoutTime (track)', (t) => {
  t.deepEqual (
    sequence.tracks [0],
    withoutTime (
      addTime (sequence.tracks [0])))
})

test ('withoutTime (track) should not do anything if no times present', (t) => {
  t.deepEqual (
    withoutTime (sequence.tracks [0]),
    sequence.tracks [0])
})

test ('withoutTime (track) should be idempotent', (t) => {
  t.deepEqual (
    withoutTime (
      addTime (sequence.tracks [0])),
    withoutTime (
      withoutTime (
        addTime (sequence.tracks [0]))))
})

test ('withoutTime (sequence)', (t) => {
  t.deepEqual (
    sequence,
    withoutTime (addTime (sequence)))
})

test ('withoutTime (sequence) should do nothing if no times are present', (t) => {
  t.deepEqual (
    withoutTime (sequence),
    sequence)
})

test ('withoutTime (sequence) should be idempotent', (t) => {
  t.deepEqual (
    withoutTime (sequence),
    withoutTime (
      withoutTime (sequence)))
})

test ('groupByTime', (t) => {
  t.deepEqual (
    groupByTime (getTrack (0) (sequence)),
    [
      [
        set (time) (0) (on (64)),
      ],
      [
        set (time) (1) (off (64)),
        set (time) (1) (on (67)),
      ],
      [
        set (time) (3) (off (67)),
      ],
      [
        set (time) (4) (on (71)),
      ],
      [
        set (time) (7) (off (71)),
      ],
      [
        set (time) (9) (endOfTrack ())
      ]
    ])
})

test ('delayHeadEvents', (t) => {
  t.deepEqual (
    delayHeadEvents (groupByTime (getTrack (0) (sequence))),
    [
      [
        set (time) (1) (on (64)),
        set (time) (1) (off (64)),
        set (time) (1) (on (67)),
      ],
      [
        set (time) (3) (off (67)),
      ],
      [
        set (time) (4) (on (71)),
      ],
      [
        set (time) (7) (off (71)),
      ],
      [
        set (time) (9) (endOfTrack ())
      ]
    ])
})

test ('delayEventsIf', (t) => {
  t.deepEqual (
    delayEventsIf (all (isNoteOff)) (getTrack (0) (sequence)),
    [
      [
        set (time) (0) (on (64)),
      ],
      [
        set (time) (1) (off (64)),
        set (time) (1) (on (67)),
      ],
      [
        set (time) (4) (off (67)),
        set (time) (4) (on (71)),
      ],
      [
        set (time) (9) (off (71)),
        set (time) (9) (endOfTrack ())
      ]
    ])
})

// ------------------------ Sequence creation ----------------------------

test ('create sequence', (t) => {
  let track = [
    set (deltaTime) (0) (on (64)),
    set (deltaTime) (1) (off (64)),
    set (deltaTime) (0) (on (67)),
    set (deltaTime) (2) (off (67)),
    set (deltaTime) (1) (on (71)),
    set (deltaTime) (3) (off (71))
  ]
  let newsequence = createSequence (track) (1)

  t.true (seemsSequence (newsequence))
  t.deepEqual (
    newsequence.tracks [0],
    [
      set (deltaTime) (0) (on (64)),
      set (deltaTime) (1) (off (64)),
      set (deltaTime) (0) (on (67)),
      set (deltaTime) (2) (off (67)),
      set (deltaTime) (1) (on (71)),
      set (deltaTime) (3) (off (71))
    ]
  )

  let track2 = [
    set (deltaTime) (0) (on (64)),
    set (deltaTime) (96) (off (64)),
    set (deltaTime) (0) (on (67)),
    set (deltaTime) (288) (off (67)),
    set (deltaTime) (384) (on (71)),
    set (deltaTime) (672) (off (71))
  ]

  newsequence = createSequence (track2) (96)

  t.true (seemsSequence (newsequence))
  t.is (newsequence.timeDivision, 96)
  t.deepEqual (
    newsequence.tracks [0],
    [
      set (deltaTime) (0) (on (64)),
      set (deltaTime) (96) (off (64)),
      set (deltaTime) (0) (on (67)),
      set (deltaTime) (288) (off (67)),
      set (deltaTime) (384) (on (71)),
      set (deltaTime) (672) (off (71))
    ])
})

test ('createLoop', (t) => {
  let loop = createLoop (sequence)

  t.true (loop.loop)
  t.deepEqual (dissoc ('loop') (loop), sequence)
})

// ------------------ Manipulating events on a track ---------------------

test ('filterEvents', (t) => {
  t.deepEqual (
    filterEvents (isNoteOff, sequence.tracks [0]),
    [
        set (deltaTime) (1) (off (64)),
        set (deltaTime) (2) (off (67)),
        set (deltaTime) (4) (off (71))
    ])
})

test ('filterEvents with repeated events', (t) => {
  t.deepEqual (
    filterEvents (
      isNoteOff, 
      [
          set (deltaTime) (0) (on (64)),
          set (deltaTime) (1) (off (64)),
          set (deltaTime) (0) (on (67)),
          set (deltaTime) (2) (off (67)),
          set (deltaTime) (1) (on (71)),
          set (deltaTime) (0) (on (73)),
          set (deltaTime) (3) (off (71)),
          set (deltaTime) (1) (off (73))
      ]),
    [
        set (deltaTime) (1) (off (64)),
        set (deltaTime) (2) (off (67)),
        set (deltaTime) (4) (off (71)),
        set (deltaTime) (1) (off (73))
    ])
})

test ('rejectEvents', (t) => {
  t.deepEqual (
    rejectEvents (isNoteOff, sequence.tracks [0]),
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (on (67)),
        set (deltaTime) (3) (on (71)),
        set (deltaTime) (5) (endOfTrack ())
    ])
})

test ('adjustTrack', (t) => {
  t.deepEqual (
    adjustTrack (0) (take (3)) (sequence),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
            set (deltaTime) (0) (on (64)),
            set (deltaTime) (1) (off (64)),
            set (deltaTime) (0) (on (67)),
        ],
        [
            set (deltaTime) (0) (on (32)),
            set (deltaTime) (8) (off (32)),
            set (deltaTime) (1) (endOfTrack ())
        ]
      ]
    })
})

test ('adjustTrack should not modify loop flag', (t) => {
  t.deepEqual (
    adjustTrack (0) (take (3)) (createLoop (sequence)),
    createLoop (adjustTrack (0) (take (3)) (sequence)))
})

test ('dropEvents', (t) => {
  t.deepEqual (
    adjustTrack (0) (dropEvents (3)) (sequence),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
            set (deltaTime) (3) (off (67)),
            set (deltaTime) (1) (on (71)),
            set (deltaTime) (3) (off (71)),
            set (deltaTime) (2) (endOfTrack ())
        ],
        [
            set (deltaTime) (0) (on (32)),
            set (deltaTime) (8) (off (32)),
            set (deltaTime) (1) (endOfTrack ())
        ]
      ]
    })
})

test ('sortEvents', (t) => {
  let new_sequence = addTime (sequence)
  let a = new_sequence.tracks [0] [0]
  let b = new_sequence.tracks [0] [3]
  new_sequence.tracks [0] [0] = b
  new_sequence.tracks [0] [3] = a
  let modified = sortEvents (new_sequence)

  t.true (seemsSequence (modified))
  t.false (identical (modified, new_sequence))
  t.not (modified.tracks, new_sequence.tracks)
  t.not (modified.tracks [0], new_sequence.tracks [0])

  let track = modified.tracks [0]

  t.is (track [0].time, 0)
  t.is (track [1].time, 1)
  t.is (track [2].time, 1)
  t.is (track [3].time, 3)
  t.is (track [4].time, 4)
  t.is (track [5].time, 7)
})

test ('sortEvents must be idempotent', (t) => {
  t.deepEqual (
    sortEvents (addTime (sequence)),
    sortEvents (sortEvents (addTime (sequence))))
})

test ('mapTrackEvents to object', (t) => {
  let m = [
    [ isNoteOff, cc (32) ]
  ]

  t.deepEqual (
    mapTrackEvents (m) (sequence.tracks [0]),
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (cc (32)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (cc (32)),
        set (deltaTime) (1) (on (71)),
        set (deltaTime) (3) (cc (32)),
        set (deltaTime) (2) (endOfTrack ())
    ])
})

test ('mapTrackEvents to function', (t) => {
  let m = [
    [ isNoteOff, (e) => cc (view (note) (e)) ]
  ]

  t.deepEqual (
    mapTrackEvents (m) (sequence.tracks [0]),
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (cc (64)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (cc (67)),
        set (deltaTime) (1) (on (71)),
        set (deltaTime) (3) (cc (71)),
        set (deltaTime) (2) (endOfTrack ())
    ])
})

test ('mapTrackEvents start/end event objects', (t) => {
  let m = [
    [ isNoteOff, [ cc (32), cc (45) ] ]
  ]

  t.deepEqual (
    mapTrackEvents (m) (sequence.tracks [0]),
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (cc (32)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (cc (45)),
        set (deltaTime) (0) (cc (32)),
        set (deltaTime) (1) (cc (45)),
        set (deltaTime) (0) (on (71)),
        set (deltaTime) (3) (cc (32)),
        set (deltaTime) (2) (cc (45)),
        set (deltaTime) (0) (endOfTrack ())
    ])
})

test ('mapTrackEvents start/end event functions', (t) => {
  const m = [
    [ isNoteOff, [ 
      (e) => cc (view (note) (e)),
      (e) => pp (view (note) (e))
    ] ]
  ]

  t.deepEqual (
    mapTrackEvents (m) (sequence.tracks [0]),
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (cc (64)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (pp (64)),
        set (deltaTime) (0) (cc (67)),
        set (deltaTime) (1) (pp (67)),
        set (deltaTime) (0) (on (71)),
        set (deltaTime) (3) (cc (71)),
        set (deltaTime) (2) (pp (71)),
        set (deltaTime) (0) (endOfTrack ())
    ])
})

test ('mapTrackEvents skipping events', (t) => {
  const m = [
    [ isNoteOff, emptyEvent () ]
  ]

  t.deepEqual (
    mapTrackEvents (m) (sequence.tracks [0]),
    [
      set (deltaTime) (0) (on (64)),
      set (deltaTime) (1) (on (67)),
      set (deltaTime) (3) (on (71)),
      set (deltaTime) (5) (endOfTrack ())
    ])    
})

test ('addDeltaTime', (t) => {
  const seq = {
    formatType: 1,
    timeDivision: 1,
    tracks: [
      [
          set (time) (0) (on (64)),
          set (time) (0) (on (32)),
          set (time) (1) (off (64)),
          set (time) (1) (on (67)),
          set (time) (3) (off (67)),
          set (time) (4) (on (71)),
          set (time) (7) (off (71)),
          set (time) (8) (off (32))
      ]
    ]
  }

  t.deepEqual (
    withoutTime (addDeltaTime (seq)),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
            set (deltaTime) (0) (on (64)),
            set (deltaTime) (0) (on (32)),
            set (deltaTime) (1) (off (64)),
            set (deltaTime) (0) (on (67)),
            set (deltaTime) (2) (off (67)),
            set (deltaTime) (1) (on (71)),
            set (deltaTime) (3) (off (71)),
            set (deltaTime) (1) (off (32))
        ]
      ]
    })
})

test ('mergeTracks', (t) => {
  let modified = mergeTracks (sequence)

  t.true (seemsSequence (modified))
  t.false (identical (modified, sequence))
  t.not (modified.tracks, sequence.tracks)
  t.not (modified.tracks [0], sequence.tracks [0])

  let track = modified.tracks [0]
  let original_track = sequence.tracks [0]

  t.true (isNoteOn (track [0]))
  t.true (isNoteOn (track [1]))
  t.is (view (note) (track [1]), 32)
  t.true (isNoteOff (track [2]))
  t.true (isNoteOn (track [3]))
  t.true (isNoteOff (track [4]))
  t.true (isNoteOn (track [5]))
  t.true (isNoteOff (track [6]))
  t.true (isNoteOff (track [7]))
  t.is (view (note) (track [7]), 32)
})

test ('mergeTracks should adapt deltaTimes', (t) => {
  t.deepEqual (
    mergeTracks (sequence),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
            set (deltaTime) (0) (on (64)),
            set (deltaTime) (0) (on (32)),
            set (deltaTime) (1) (off (64)),
            set (deltaTime) (0) (on (67)),
            set (deltaTime) (2) (off (67)),
            set (deltaTime) (1) (on (71)),
            set (deltaTime) (3) (off (71)),
            set (deltaTime) (1) (off (32)),
            set (deltaTime) (1) (endOfTrack ())
        ]
      ]
    })
})

test ('mergeTracks must be idempotent', (t) => {
  t.deepEqual (
    mergeTracks (sequence),
    mergeTracks (mergeTracks (sequence)))
})

test ('mergeTracks should not modify the loop flag', (t) => {
  t.deepEqual (
    createLoop (mergeTracks (sequence)),
    mergeTracks (createLoop (sequence)))
})

test ('setTimeDivision', (t) => {
  let modified = setTimeDivision (4) (sequence)
  let track0 = modified.tracks [0]
  let track1 = modified.tracks [1]

  t.is (modified.timeDivision, 4)

  t.is (track0 [0].deltaTime, 0)
  t.is (track0 [1].deltaTime, 4)
  t.is (track0 [2].deltaTime, 0)
  t.is (track0 [3].deltaTime, 8)
  t.is (track0 [4].deltaTime, 4)
  t.is (track0 [5].deltaTime, 12)

  t.is (track1 [0].deltaTime, 0)
  t.is (track1 [1].deltaTime, 32)
})

test ('setTimeDivision must be idempotent', (t) => {
  let modified = setTimeDivision (4) (setTimeDivision (4) (sequence))
  let track0 = modified.tracks [0]
  let track1 = modified.tracks [1]

  t.is (modified.timeDivision, 4)

  t.is (track0 [0].deltaTime, 0)
  t.is (track0 [1].deltaTime, 4)
  t.is (track0 [2].deltaTime, 0)
  t.is (track0 [3].deltaTime, 8)
  t.is (track0 [4].deltaTime, 4)
  t.is (track0 [5].deltaTime, 12)

  t.is (track1 [0].deltaTime, 0)
  t.is (track1 [1].deltaTime, 32)
})
