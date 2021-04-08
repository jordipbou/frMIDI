const test = require ('ava')
import * as R from 'ramda'
import * as X from 'rxjs'
import * as M from '../src/index.js'

test ('Routing matrix', (t) => {
  const i1$ = new X.Subject ()
  const i2$ = new X.Subject ()
  const st$ = new X.Subject ()
  const outputs = M.routing_matrix ([i1$, i2$], 2, st$)

  let rcvd1 = []
  let rcvd2 = []

  outputs [0].subscribe ((v) => rcvd1 = R.append (v) (rcvd1))
  outputs [1].subscribe ((v) => rcvd2 = R.append (v) (rcvd2))

  // Matrix is fully deactivated
  i1$.next (1)
  i2$.next (2)

  t.deepEqual ([], rcvd1)
  t.deepEqual ([], rcvd1)

  // input1 goes to output1 and output2, input2 goes to output2 only
  rcvd1 = []
  rcvd2 = []

  st$.next ([[true, false], [true, true]])
  i1$.next (3)
  i2$.next (4)

  t.deepEqual ([3], rcvd1)
  t.deepEqual ([3, 4], rcvd2)
 
  // input1 goes to output2 and input2 goes to output1
  rcvd1 = []
  rcvd2 = []

  st$.next ([[false, true], [true, false]])
  i1$.next (5)
  i2$.next (6)

  t.deepEqual ([6], rcvd1)
  t.deepEqual ([5], rcvd2)

  // input1 and input2 go to output1 and output2
  rcvd1 = []
  rcvd2 = []

  st$.next ([[true, true], [true, true]])
  i1$.next (7)
  i1$.next (8)

  t.deepEqual ([7, 8], rcvd1)
  t.deepEqual ([7, 8], rcvd2)
 
  // matrix deactivated again
  rcvd1 = []
  rcvd2 = []

  st$.next ([[false, false], [false, false]])
  i1$.next (9)
  i2$.next (10) 

  t.deepEqual ([], rcvd1)
  t.deepEqual ([], rcvd2)
})
