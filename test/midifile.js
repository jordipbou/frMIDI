const test = require ('ava')
const { 
  isNoteOn, isNoteOff,
  seemsMIDIMessage 
} = require ('../../src/frMIDI/predicates.js')
const { on, off, mc } = require ('../../src/frMIDI/messages.js')
const { 
  deltaTime, note, timeStamp
} = require ('../../src/frMIDI/lenses.js')
const { 
  createMIDIFile,
  createLoop,
  filterTracks,
  mergeTracks,
  MIDIFilePlayer,
  seemsMIDIFile,
  sortEvents,
  withAbsoluteDeltaTimes
} = require ('../../src/frMIDI/midifile.js')
const { identical, is, set, view } = require ('ramda')

let midifile = {
  formatType: 1,
  tracks: 1,
  track: [{
      event: [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (off (64)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (off (67)),
        set (deltaTime) (1) (on (71)),
        set (deltaTime) (3) (off (71))
      ]
    }, {
      event: [
        set (deltaTime) (0) (on (32)),
        set (deltaTime) (8) (off (32)),
      ]
    }
  ],
  timeDivision: 1
}

test ('seemsMIDIFile', t => {
  t.true (seemsMIDIFile (midifile))
})

test ('withAbsoluteDeltaTimes', t => {
  let modified = withAbsoluteDeltaTimes (midifile)

  t.true (seemsMIDIFile (modified))
  t.not (modified.track, midifile.track)
  t.not (modified.track [0], midifile.track [0])
  t.not (modified.track [1], midifile.track [1])
  t.not (modified.track [0].event, midifile.track [0].event)
  t.not (modified.track [1].event, midifile.track [1].event)

  let track = modified.track [0].event
  let original_track = midifile.track [0].event

  t.is (track.length, 6)
  t.is (track [0].absoluteDeltaTime, 0)
  t.is (track [1].absoluteDeltaTime, 1)
  t.is (track [2].absoluteDeltaTime, 1)
  t.is (track [3].absoluteDeltaTime, 3)
  t.is (track [4].absoluteDeltaTime, 4)
  t.is (track [5].absoluteDeltaTime, 7)
  t.false (identical (original_track [0].data, track [0].data))
  t.false (identical (original_track [1].data, track [1].data))
  t.false (identical (original_track [2].data, track [2].data))
  t.false (identical (original_track [3].data, track [3].data))
  t.false (identical (original_track [4].data, track [4].data))
  t.false (identical (original_track [5].data, track [5].data))

  let track1 = modified.track [1].event

  t.is (track1.length, 2)
  t.is (track1 [0].absoluteDeltaTime, 0)
  t.is (track1 [1].absoluteDeltaTime, 8)
})

test ('mergeTracks', t => {
  let modified = mergeTracks (midifile)
  
  t.true (seemsMIDIFile (modified))
  t.false (identical (modified, midifile))
  t.not (modified.track, midifile.track)
  t.not (modified.track [0], midifile.track [0])
  t.not (modified.track [0].event, midifile.track [0].event)

  let track = modified.track [0].event
  let original_track = midifile.track [0].event

  t.true (isNoteOn (track [0]))
  t.false (identical (track [0], original_track [0]))
  t.true (isNoteOff (track [1]))
  t.false (identical (track [1], original_track [1]))
  t.true (isNoteOn (track [2]))
  t.false (identical (track [2], original_track [2]))
  t.true (isNoteOff (track [3]))
  t.false (identical (track [3], original_track [3]))
  t.true (isNoteOn (track [4]))
  t.false (identical (track [4], original_track [4]))
  t.true (isNoteOff (track [5]))
  t.false (identical (track [5], original_track [5]))
  t.true (isNoteOn (track [6]))
  t.is (view (note) (track [6]), 32)
  t.true (isNoteOff (track [7]))
  t.is (view (note) (track [7]), 32)
})

test ('sortEvents', t => {
  let new_midifile = mergeTracks (withAbsoluteDeltaTimes (midifile))
  let modified = sortEvents (new_midifile)

  t.true (seemsMIDIFile (modified))
  t.false (identical (modified, new_midifile))
  t.not (modified.track, new_midifile.track)
  t.not (modified.track [0], new_midifile.track [0])
  t.not (modified.track [0].event, new_midifile.track [0].event)

  let track = modified.track [0].event
  let original_track = new_midifile.track [0].event

  t.is (track [0].absoluteDeltaTime, 0)
  t.false (identical (track [0], original_track [0]))
  t.is (track [1].absoluteDeltaTime, 0)
  t.false (identical (track [1], original_track [1]))
  t.is (track [2].absoluteDeltaTime, 1)
  t.false (identical (track [2], original_track [2]))
  t.is (track [3].absoluteDeltaTime, 1)
  t.false (identical (track [3], original_track [3]))
  t.is (track [4].absoluteDeltaTime, 3)
  t.false (identical (track [4], original_track [4]))
  t.is (track [5].absoluteDeltaTime, 4)
  t.false (identical (track [5], original_track [5]))
  t.is (track [6].absoluteDeltaTime, 7)
  t.false (identical (track [6], original_track [6]))
  t.is (track [7].absoluteDeltaTime, 8)
  t.false (identical (track [7], original_track [7]))
})

test ('filterTracks', t => {
  let modified = filterTracks ([1], midifile)

  t.true (seemsMIDIFile (modified))
  t.false (identical (modified, midifile))
  t.not (modified.track, midifile.track)
  t.not (modified.track [0], midifile.track [1])
  t.not (modified.track [0].event, midifile.track [1].event)

  t.is (modified.tracks, 1)

  let track = modified.track [0].event
  let original_track = midifile.track [1].event

  t.is (track.length, 2)
  t.is (track [0].deltaTime, 0)
  t.false (identical (track [0], original_track [0]))
  t.is (track [1].deltaTime, 8)
  t.false (identical (track [1], original_track [1]))
})

test ('createMIDIFile', t => {
  let track = [
    set (deltaTime) (0) (on (64)),
    set (deltaTime) (1) (off (64)),
    set (deltaTime) (0) (on (67)),
    set (deltaTime) (2) (off (67)),
    set (deltaTime) (1) (on (71)),
    set (deltaTime) (3) (off (71))
  ]
  let newfile = createMIDIFile (track)

  t.true (seemsMIDIFile (newfile))
  t.deepEqual (track[0], newfile.track [0].event [0])
  t.false (identical (track [0], newfile.track [0].event [0]))
  t.deepEqual (track[1], newfile.track [0].event [1])
  t.false (identical (track [1], newfile.track [0].event [1]))
  t.deepEqual (track[2], newfile.track [0].event [2])
  t.false (identical (track [2], newfile.track [0].event [2]))
  t.deepEqual (track[3], newfile.track [0].event [3])
  t.false (identical (track [3], newfile.track [0].event [3]))
  t.deepEqual (track[4], newfile.track [0].event [4])
  t.false (identical (track [4], newfile.track [0].event [4]))
  t.deepEqual (track[5], newfile.track [0].event [5])
  t.false (identical (track [5], newfile.track [0].event [5]))
})

test ('createLoop', t => {
  let loop = createLoop (midifile)

  t.true (loop.loop)
  t.false (identical (loop, midifile))
  t.false (identical (loop.track, midifile.track))
  t.not (loop.track [0], midifile.track [1])
  t.not (loop.track [0].event, midifile.track [1].event)

  t.is (loop.tracks, midifile.tracks)
  t.is (loop.track.length, midifile.track.length)
  t.is (loop.track [0].event.length, midifile.track [0].event.length)
  t.is (loop.track [1].event.length, midifile.track [1].event.length)
})

test ('MIDIFilePlayer', t => {
  let mc1 = set (timeStamp) (10.5) (mc ())

  let [events, tick] = MIDIFilePlayer (midifile, 0, [mc1])

  t.is (tick, 1)
  t.is (events.length, 2)
  t.deepEqual (events [0].data, on (64).data)
  t.is (events [0].timeStamp, 10.5)
  t.deepEqual (events [1].data, on (32).data)
  t.is (events [1].timeStamp, 10.5)

  let player = MIDIFilePlayer (midifile)

  let [events1, tick1] = player (0, [mc1])

  t.is (tick1, 1)
  t.is (events1.length, 2)
  t.deepEqual (events1 [0].data, on (64).data)
  t.is (events1 [0].timeStamp, 10.5)
  t.deepEqual (events1 [1].data, on (32).data)
  t.is (events1 [1].timeStamp, 10.5)

  let mc2 = set (timeStamp) (11.5) (mc ())
  let mc3 = set (timeStamp) (12.5) (mc ())

  let [events2, tick2] = player (0, [mc1, mc2, mc3])
  t.is (tick2, 3)
  t.is (events2.length, 4)

  let [events3, tick3] = player (8, [mc1])

  t.is (tick3, 9)
  t.is (events3.length, 1)
  t.deepEqual (events3 [0].data, off (32).data)
  t.is (events3 [0].timeStamp, 10.5)
})

test ('looped MIDIFilePlayer', t => {
  let loop = createLoop (midifile)
  let player = MIDIFilePlayer (loop)

  let mc1 = set (timeStamp) (10.5) (mc ())
  let [events, tick] = player (8, [mc1])

  t.is (tick, 1)
  t.is (events.length, 3)

  t.deepEqual (events [0].data, on (64).data)
  t.is (events [0].timeStamp, 10.5)
  t.deepEqual (events [1].data, on (32).data)
  t.is (events [1].timeStamp, 10.5)
  t.deepEqual (events [2].data, off (32).data)
  t.is (events [2].timeStamp, 10.5)
})
