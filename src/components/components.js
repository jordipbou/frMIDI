import * as R from 'ramda'
import * as X from 'rxjs'

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
