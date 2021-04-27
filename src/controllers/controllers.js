import * as R from 'ramda'
import * as X from 'rxjs'
import * as O from 'rxjs/operators'
import { cc, cc14bit, from, value14bit } from '../messages/messages.js'
import { mpeZone, processMessage } from '../mpe/mpe.js'
import { asNoteOff, controlEq } from '../predicates/predicates.js'
import { channel, control, timeStamp, value } from '../lenses/lenses.js'

// inputs is an array of streams
// n_outputs indicates the amount of outputs of this matrix
// Expects a state in the form [outputs][inputs], with a true/false
// value in each cell indicating if input should pass or not. Example:
// state = [ [true, false], [false, true] ]
// represents a two inputs/two outputs routing matrix, routing first
// input to first output and second input to second output
export const routing_matrix = (inputs, n_outputs, state$) => {
  const outputs = R.map ((o) => new X.Subject ()) (R.range (0, n_outputs))
  let subscriptions = []

  // At initialization, nothing is routed (everything is disconnected)
  // as nothing has been received from state$. If some initial state
  // is desired, function should be called as:
  // routing_matrix ([inputs], 2, state$.startWith (--desired state--))
  state$.subscribe ((state) => {
    R.forEach ((s) => s.unsubscribe ()) (subscriptions)

    subscriptions =
      R.flatten
        (R.map 
          (([inputs, output]) => 
            R.map ((i) => i.subscribe (output)) (inputs))
          (R.zip
            (R.map
              ((zipped_row) =>
                R.map
                  (([p, input]) => input)
                  (R.filter (([p, input]) => p) (zipped_row)))
              (R.map ((row) => R.zip (row) (inputs)) (state)))
            (outputs)))
  })

  return outputs
}

const seamless_subscribe = (input$) => (output$) => {
  let zone = mpeZone (15, 15)

  let subscription = input$.pipe (
    O.tap ((msg) => zone = processMessage (zone) (msg))
  ).subscribe (output$)

  return {
    unsubscribe: () => {
      subscription.unsubscribe ()
      subscription =
        input$.pipe (
          O.filter (asNoteOff),
          O.tap ((msg) => {
            zone = processMessage (zone) (msg)
            if (zone.activeNotes.length === 0) {
              subscription.unsubscribe ()
              subscription = null
              zone = null
              output$.next (msg)
            }
          })
        ).subscribe (output$)
    }
  }
}

// Works as routing_matrix but maintains connection open until all
// active notes on of an input receive their corresponding notes off.
// Only notes off will be allowed.
export const seamless_routing_matrix = (inputs, n_outputs, state$) => {
  const outputs = R.map ((o) => new X.Subject ()) (R.range (0, n_outputs))
  let subscriptions = []

  // At initialization, nothing is routed (everything is disconnected)
  // as nothing has been received from state$. If some initial state
  // is desired, function should be called as:
  // routing_matrix ([inputs], 2, state$.startWith (--desired state--))
  state$.subscribe ((state) => {
    R.forEach ((s) => s.unsubscribe ()) (subscriptions)

    subscriptions =
      R.flatten
        (R.map 
          (([inputs, output$]) => 
            R.map 
              ((input$) => seamless_subscribe (input$) (output$)) 
              (inputs))
          (R.zip
            (R.map
              ((zipped_row) =>
                R.map
                  (([p, input$]) => input$)
                  (R.filter (([p, input$]) => p) (zipped_row)))
              (R.map ((row) => R.zip (row) (inputs)) (state)))
            (outputs)))
  })

  return outputs
}

export const CC14bitFromCCs = (cc_msb, cc_lsb, cc_out) => 
  X.pipe (
    O.scan (([msb, lsb, _], msg) => 
      R.cond ([
        [controlEq (cc_msb), 
          (msg, 
          msb = R.view (value) (msg),
          ch = R.view (channel) (msg),
          ts = R.view (timeStamp) (msg)) => [
            msb,
            lsb,
            cc14bit (cc_out, value14bit (msb, lsb), ch, ts)]],
        [controlEq (cc_lsb), 
          (msg, 
          lsb = R.view (value) (msg),
          ch = R.view (channel) (msg),
          ts = R.view (timeStamp) (msg)) => [
            msb,
            lsb,
            cc14bit (cc_out, value14bit (msb, lsb), ch, ts)]],
        [R.T, 
          R.always ([msb, lsb, msg])]
      ]) (msg), 
      [0, 0, null]),
    O.map (([_, __, cc14]) => cc14))

export const CCsFromCC14bit = (cc_in, cc_msb, cc_lsb) =>
  X.pipe (
    O.map (
      R.cond ([
        [controlEq (cc_in), R.set (control) (cc_msb)],
        [controlEq (cc_in + 32), R.set (control) (cc_lsb)],
        [R.T, R.identity]
      ])))

