const test = require ('ava')
import { 
  isNoteOn, isNoteOff, seemsMessage 
} from '../../src/predicates'
import { on, off, mc, start, stop, cont } from '../../src/messages'
import { sequenceEvent } from '../../src/messages/frmeta.js'
import { 
  absoluteDeltaTime, deltaTime, note, timeStamp
} from '../../src/lenses/lenses.js'
import { 
  adjustTrack, createSequence, createLoop, deltaTimesFromAbsolutes,
  dropEvents,
  filterEvents, insertEvent, insertAllEvents,
  mapEvents, mapTracks, mergeTracks, 
  rejectEvents, seemsTrack, seemsSequence, sortEvents, setTimeDivision,
  eventWithAbsoluteDeltaTime, 
  trackWithAbsoluteDeltaTimes, trackWithoutAbsoluteDeltaTimes,
  withAbsoluteDeltaTimes, withoutAbsoluteDeltaTimes
} from '../../src/sequences/sequences.js'
import { multiSet } from '../../src/utils.js'
import { 
  assoc, dissoc, drop, head, identical, is, 
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
        set (deltaTime) (3) (off (71))
    ],
    [
        set (deltaTime) (0) (on (32)),
        set (deltaTime) (8) (off (32)),
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
            set (deltaTime) (1) (off (71))
        ],
        [
            set (deltaTime) (1) (on (32)),
            set (deltaTime) (1) (off (32)),
        ]
      ]
    })
})

// -------------------- Set absolute delta times -------------------------

test ('add absolute delta time to single message', (t) => {
  t.deepEqual (
    eventWithAbsoluteDeltaTime 
      (0) 
      (set (deltaTime) (0) (on (64))),
    [
      0, 
      assoc 
        ('absoluteDeltaTime') 
        (0) 
        (set (deltaTime) (0) (on (64)))])

  t.deepEqual (
    eventWithAbsoluteDeltaTime 
      (150) 
      (set (deltaTime) (0) (on (64))),
    [
      150, 
      assoc 
        ('absoluteDeltaTime') 
        (150) 
        (set (deltaTime) (0) (on (64)))])

  t.deepEqual (
    eventWithAbsoluteDeltaTime 
      (150) 
      (set (deltaTime) (15) (on (64, 96))),
    [
      165, 
      assoc 
        ('absoluteDeltaTime') 
        (165) 
        (set (deltaTime) (15) (on (64, 96)))])
})

test ('withAbsoluteDeltaTimes (one track)', (t) => {
  const modified = trackWithAbsoluteDeltaTimes (sequence.tracks [0])

  t.true (seemsTrack (modified))
  t.not (modified, sequence.tracks [0])

  t.is (modified.length, 6)
  t.is (modified [0].absoluteDeltaTime, 0)
  t.is (modified [1].absoluteDeltaTime, 1)
  t.is (modified [2].absoluteDeltaTime, 1)
  t.is (modified [3].absoluteDeltaTime, 3)
  t.is (modified [4].absoluteDeltaTime, 4)
  t.is (modified [5].absoluteDeltaTime, 7)
})

test ('withAbsoluteDeltaTimes (one track) should be idempotent', (t) => {
  t.deepEqual (
    trackWithAbsoluteDeltaTimes (sequence.tracks [0]),
    trackWithAbsoluteDeltaTimes (
      trackWithAbsoluteDeltaTimes (sequence.tracks [0])))
})

test ('withAbsoluteDeltaTimes (on multiple tracks)', (t) => {
  let modified = withAbsoluteDeltaTimes (sequence)

  t.true (seemsSequence (modified))
  t.not (modified.tracks, sequence.tracks)
  t.not (modified.tracks [0], sequence.tracks [0])
  t.not (modified.tracks [1], sequence.tracks [1])

  let track = modified.tracks [0]

  t.is (track.length, 6)
  t.is (track [0].absoluteDeltaTime, 0)
  t.is (track [1].absoluteDeltaTime, 1)
  t.is (track [2].absoluteDeltaTime, 1)
  t.is (track [3].absoluteDeltaTime, 3)
  t.is (track [4].absoluteDeltaTime, 4)
  t.is (track [5].absoluteDeltaTime, 7)

  let track1 = modified.tracks [1]

  t.is (track1.length, 2)
  t.is (track1 [0].absoluteDeltaTime, 0)
  t.is (track1 [1].absoluteDeltaTime, 8)
})

test ('withAbsoluteDeltaTimes (sequence) should be idempotent', (t) => {
  t.deepEqual (
    withAbsoluteDeltaTimes (sequence),
    withAbsoluteDeltaTimes (withAbsoluteDeltaTimes (sequence)))
})

test ('withoutAbsoluteDeltaTimes (track)', (t) => {
  t.deepEqual (
    sequence.tracks [0],
    trackWithoutAbsoluteDeltaTimes (
      trackWithAbsoluteDeltaTimes (sequence.tracks [0])))
})

test ('withoutAbsoluteDeltaTimes (track) should not do anything if no absoluteDeltaTimes present', (t) => {
  t.deepEqual (
    trackWithoutAbsoluteDeltaTimes (sequence.tracks [0]),
    sequence.tracks [0])
})

test ('withoutAbsoluteDeltaTimes (track) should be idempotent', (t) => {
  t.deepEqual (
    trackWithoutAbsoluteDeltaTimes (
      trackWithAbsoluteDeltaTimes (sequence.tracks [0])),
    trackWithoutAbsoluteDeltaTimes (
      trackWithoutAbsoluteDeltaTimes (
        trackWithAbsoluteDeltaTimes (sequence.tracks [0]))))
})

test ('withoutAbsoluteDeltaTimes (sequence)', (t) => {
  t.deepEqual (
    sequence,
    withoutAbsoluteDeltaTimes (withAbsoluteDeltaTimes (sequence)))
})

test ('withoutAbsoluteDeltaTimes (sequence) should do nothing if no absoluteDeltaTimes are present', (t) => {
  t.deepEqual (
    withoutAbsoluteDeltaTimes (sequence),
    sequence)
})

test ('withoutAbsoluteDeltaTimes (sequence) should be idempotent', (t) => {
  t.deepEqual (
    withoutAbsoluteDeltaTimes (sequence),
    withoutAbsoluteDeltaTimes (
      withoutAbsoluteDeltaTimes (sequence)))
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
            set (deltaTime) (3) (off (71))
        ],
        [
            set (deltaTime) (0) (on (32)),
            set (deltaTime) (8) (off (32)),
        ]
      ]
    })
})

test ('sortEvents', (t) => {
  let new_sequence = withAbsoluteDeltaTimes (sequence)
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

  t.is (track [0].absoluteDeltaTime, 0)
  t.is (track [1].absoluteDeltaTime, 1)
  t.is (track [2].absoluteDeltaTime, 1)
  t.is (track [3].absoluteDeltaTime, 3)
  t.is (track [4].absoluteDeltaTime, 4)
  t.is (track [5].absoluteDeltaTime, 7)
})

test ('sortEvents must be idempotent', (t) => {
  t.deepEqual (
    sortEvents (withAbsoluteDeltaTimes (sequence)),
    sortEvents (sortEvents (withAbsoluteDeltaTimes (sequence))))
})

test ('deltaTimesFromAbsolutes', (t) => {
  const seq = {
    formatType: 1,
    timeDivision: 1,
    tracks: [
      [
          set (absoluteDeltaTime) (0) (on (64)),
          set (absoluteDeltaTime) (0) (on (32)),
          set (absoluteDeltaTime) (1) (off (64)),
          set (absoluteDeltaTime) (1) (on (67)),
          set (absoluteDeltaTime) (3) (off (67)),
          set (absoluteDeltaTime) (4) (on (71)),
          set (absoluteDeltaTime) (7) (off (71)),
          set (absoluteDeltaTime) (8) (off (32))
      ]
    ]
  }

  t.deepEqual (
    withoutAbsoluteDeltaTimes (deltaTimesFromAbsolutes (seq)),
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
            set (deltaTime) (1) (off (32))
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
