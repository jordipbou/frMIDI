import { isMIDIClock } from '../predicates'
import { timeStamp } from '../lenses'
import { pipe as rx_pipe } from 'rxjs'
import { scan as rxo_scan, map as rxo_map } from 'rxjs/operators'
import { assoc, view } from 'ramda'

// A quantizer must receive MIDI Clock messages interleaved with
// normal input messages to be able to know current clock positions.
export const quantizer = () => 
  rx_pipe (
    rxo_scan (([res, last_timestamp, _1], msg) => {
      if (isMIDIClock (msg)) {
        return [
          view (timeStamp) (msg) - last_timestamp,
          view (timeStamp) (msg),
          msg
        ]
      } else {
        if (res === 0) {
          return [res, last_timestamp, msg]
        } else {
          if (view (timeStamp) (msg) - last_timestamp <= (res/2)) {
            return [
              res,
              last_timestamp,
              assoc ('quantizedTimeStamp') (last_timestamp) (msg)
            ]
          } else {
            return [
              res,
              last_timestamp,
              assoc ('quantizedTimeStamp') (last_timestamp + res) (msg)
            ]
          }
        }
      }
    }, [0, 0, null]),
    rxo_map (([_1, _2, msg]) => msg)
  )
