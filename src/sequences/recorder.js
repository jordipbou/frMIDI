import { createSequence } from '../sequences/sequences.js'
import { 
  isMIDIClock, isStart, isContinue, isStop 
} from '../predicates/predicates.js'
import { sequenceEvent } from '../messages/frmeta.js'
import { deltaTime } from '../lenses/lenses.js'
import {
  append, cond, either, evolve, F, isNil, isEmpty, T, set
} from 'ramda'
import { from as rx_from, NEVER as rx_NEVER, pipe as rx_pipe } from 'rxjs'
import { mergeMap as rxo_mergeMap, scan as rxo_scan } from 'rxjs/operators'

// --------------------- Recording MIDI Sequences ------------------------

export const recordToTrack = (delta) => (sequence) => (msg) =>
  evolve ({
    tracks: 
      (tracks) => [ append (set (deltaTime) (delta) (msg)) (tracks [0]) ]
  }) (sequence)

export const recorder = (timeDivision, paused = true) =>
  rx_pipe (
    rxo_scan (([seq, delta, recording, td, _], msg) =>
      cond ([
        
        [isMIDIClock, 
          (msg) => recording ? [seq, delta + 1, true, td, [msg]]
                               : [seq, delta, false, td, [msg]]],

        [isStart, 
          (msg) => 
            [createSequence ([], td), 0, recording, td, [msg]]],

        [isContinue,
          (msg) => [seq, delta, true, td, [msg]]],

        [isStop,
          // stop message should add one end of track meta message to
          // have a sequence with the correct length
          (msg) => [seq, delta, false, td, [msg]]],

        [T,
          (msg) => 
            cond ([
              [T, 
                () => {
                  const nextSeq = recordToTrack (delta) (seq) (msg)

                  return [
                    nextSeq, 
                    delta, 
                    true, 
                    td, 
                    [ msg, sequenceEvent (nextSeq) ]
                  ]
                }],

              [F, () => [seq, delta, false, td, [msg]]],
            ]) (recording)]

      ]) (msg)

    , [createSequence ([], timeDivision), 
        0, 
        0, 
        !paused, 
        timeDivision, 
        null]),

    rxo_mergeMap (([_s, _d, _r, _td, events]) => 
      either (isNil) (isEmpty) (events) ?
        rx_NEVER
        : rx_from (events)))


