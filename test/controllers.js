const test = require ('ava')
import * as R from 'ramda'
import * as X from 'rxjs'
import * as O from 'rxjs/operators'
import * as M from '../src/index.js'
import { 
  colorsFromState, disownNote, getOwnerCell, ownNote, setColor 
} from '../src/controllers/linnstrument.js'

// --------------------------------Routing and Seamless routing matrix

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

test ('Seamless routing matrix', (t) => {
  const i1$ = new X.Subject ()
  const i2$ = new X.Subject ()
  const st$ = new X.Subject ()
  const outputs = M.seamless_routing_matrix ([i1$, i2$], 2, st$)

  let rcvd1 = []
  let rcvd2 = []

  outputs [0].subscribe ((v) => rcvd1 = R.append (v) (rcvd1))
  outputs [1].subscribe ((v) => rcvd2 = R.append (v) (rcvd2))

  // Matrix is fully deactivated
  i1$.next (M.on (32))
  i2$.next (M.on (33))

  t.deepEqual ([], rcvd1)
  t.deepEqual ([], rcvd1)

  // input1 goes to output1 and output2, input2 goes to output2 only
  rcvd1 = []
  rcvd2 = []

  st$.next ([[true, false], [true, true]])
  i1$.next (M.on (34))
  i2$.next (M.on (35))

  t.deepEqual ([M.on (34)], rcvd1)
  t.deepEqual ([M.on (34), M.on (35)], rcvd2)

  // Disconnecting all pins, only notes off will be received
  // until active notes on disappear
  rcvd1 = []
  rcvd2 = []

  st$.next ([[false, false], [false, false]])
  i1$.next (M.off (10))
  i1$.next (M.on (11))
  i1$.next (M.off (34))
  i1$.next (M.off (12))
  i1$.next (M.on (13))

  t.deepEqual ([M.off (10), M.off (34)], rcvd1)

  // input1 goes to output2 and input2 goes to output1
  // input2 notes off still will be received
  rcvd1 = []
  rcvd2 = []

  st$.next ([[false, true], [true, false]])
  i1$.next (M.on (36))
  i1$.next (M.off (36))
  i2$.next (M.off (14))
  i2$.next (M.on (37))
  i2$.next (M.off (35))
  i2$.next (M.on (38))
  i2$.next (M.off (38))

  t.deepEqual ([M.off (14), M.on (37), M.off (35), M.on (38), M.off (38)], rcvd1)
  t.deepEqual ([M.on (36), M.off (36), M.off (14), M.off (35)], rcvd2)
})

test ('CC14bitFromCCs', (t) => {
  const st$ = X.of (M.cc (16), M.cc (14, 64), M.cc (15, 96))
  let rcvd = []

  st$.pipe (
    M.CC14bitFromCCs (14, 15, 1)
  ).subscribe ((msg) => rcvd = R.append (msg) (rcvd))
 
  t.deepEqual (
    rcvd, [
      M.cc (16), 
      M.from ([M.cc (1, 64), M.cc (33, 0)]),
      M.from ([M.cc (1, 64), M.cc (33, 96)])
    ])
})

test ('CCsFromCC14bit', (t) => {
  const st$ = X.of (M.cc (16), M.cc (1, 64), M.cc (33, 96))
  let rcvd = []
  
  st$.pipe (
    M.CCsFromCC14bit (1, 14, 15)
  ).subscribe ((msg) => rcvd = R.append (msg) (rcvd))

  t.deepEqual (
    rcvd,
    [
      M.cc (16),
      M.cc (14, 64),
      M.cc (15, 96)
    ])
})

// --------------------------------------------- LinnStrument

test ('createState', (t) => {
  const cell = { color: 7 }
  const column = [cell, cell, cell, cell, cell, cell, cell, cell]
  t.deepEqual (
    M.createState (),
    {
      ownedNotes: [],
      cells: [
        column, column, column, column, 
        column, column, column, column, 
        column, column, column, column, 
        column, column, column, column, 
        column
      ]
    })

  t.deepEqual (
    M.createState (2, 3),
    {
      ownedNotes: [],
      cells: [
        [ cell, cell, cell ],
        [ cell, cell, cell ]
      ]
    })
})

test ('ownNote', (t) => {
  t.deepEqual (
    ownNote (3) (0) (1) (0) (M.createState (2, 2)),
    {
      ownedNotes: [{ note: 3, channel: 0, x: 1, y: 0 }],
      cells: [
        [{ color: 7 }, { color: 7 }],
        [{ color: 7 }, { color: 7 }]
      ]
    })
})

test ('disownNote', (t) => {
  t.deepEqual (
    disownNote 
      (3) (0) 
      (ownNote 
        (7) (1) (0) (1)
        (ownNote 
          (3) (0) (1) (0)
          (ownNote 
            (12) (5) (0) (0)
            (M.createState (2, 2))))),
    {
      ownedNotes: [
        { note: 12, channel: 5, x: 0, y: 0 },
        { note: 7, channel: 1, x: 0, y: 1 }
      ],
      cells: [
        [{ color: 7 }, { color: 7 }],
        [{ color: 7 }, { color: 7 }]
      ]
    })
})

test ('getCell', (t) => {
  t.deepEqual (
    M.getCell (1) (0) (M.assocCell (1) (0) ('color') (3) (M.createState (2, 2))),
    {
      color: 3
    })
})

test ('getOwnerCell', (t) => {
  t.deepEqual (
    getOwnerCell 
      (1) (0) 
      (ownNote
        (1) (0)
        (0) (1)
        (M.assocCell 
          (0) (1) 
          ('color') (3) 
          (M.assocCell
            (1) (0)
            ('color') (4)
            (M.createState (2, 2))))),
    {
      color: 3
    })

  t.deepEqual (
    getOwnerCell
      (1) (0)
      (M.assocCell (1) (0) ('color') (4) (M.createState (2, 2))),
    {
      color: 4
    })
})

test ('adjustCell', (t) => {
  const fn = () => ({ color: 5, data: false })
  t.deepEqual (
    M.adjustCell (1, 1, fn, M.createState (3, 3)),
    {
      ownedNotes: [],
      cells: [
        [{ color: 7 }, { color: 7 }, { color: 7 }],
        [{ color: 7 }, { color: 5, data: false }, { color: 7 }],
        [{ color: 7 }, { color: 7 }, { color: 7 }]
      ]
    })
})

test ('assocCell', (t) => {
  t.deepEqual (
    M.assocCell (1, 1, 'color', 5, M.createState (3, 3)),
    {
      ownedNotes: [],
      cells: [
        [{ color: 7 }, { color: 7 }, { color: 7 }],
        [{ color: 7 }, { color: 5 }, { color: 7 }],
        [{ color: 7 }, { color: 7 }, { color: 7 }]
      ]
    })
})

test ('dissocCell', (t) => {
  t.deepEqual (
    M.dissocCell (1, 1, 'color', M.createState (3, 3)),
    {
      ownedNotes: [],
      cells: [
        [{ color: 7 }, { color: 7 }, { color: 7 }],
        [{ color: 7 }, {          }, { color: 7 }],
        [{ color: 7 }, { color: 7 }, { color: 7 }]
      ]
    })
})

test ('evolveCell', (t) => {
  const transformations = { color: (c) => c + 2 }
  t.deepEqual (
    M.evolveCell (1, 1, transformations, M.createState (3, 3)),
    {
      ownedNotes: [],
      cells: [
        [{ color: 7 }, { color: 7 }, { color: 7 }],
        [{ color: 7 }, { color: 9 }, { color: 7 }],
        [{ color: 7 }, { color: 7 }, { color: 7 }]
      ]
    })
})

test ('colorsFromState', (t) => {
  const st = 
    M.assocCell (0, 0, 'color', 1)
      (M.assocCell (0, 1, 'color', 2)
        (M.assocCell (1, 0, 'color', 3)
          (M.assocCell (1, 1, 'color', 4)
            (M.createState (2, 2)))))

  t.deepEqual (
    colorsFromState (st),
    [
      setColor (0, 0, 1),
      setColor (0, 1, 2),
      setColor (1, 0, 3),
      setColor (1, 1, 4)
    ])
})

test ('changeState', (t) => {
  const st = 
    M.assocCell (0, 0, 'color', 1)
      (M.assocCell (0, 1, 'color', 2)
        (M.assocCell (1, 0, 'color', 3)
          (M.assocCell (1, 1, 'color', 4)
            (M.createState (2, 2)))))

  const st2 = M.assocCell (0, 1, 'color', 5) (st)

  t.deepEqual (
    M.changeState (st2, st),
    setColor (0, 1, 5))

  t.deepEqual (
    M.changeState (st),
    M.from ([
      setColor (0, 0, 1),
      setColor (0, 1, 2),
      setColor (1, 0, 3),
      setColor (1, 1, 4)
    ]))
})

// TODO:
//test ('createListener', (t) => {
//})

//test ('createMatrix', (t) => {
//  const cell = { color: 7 }
//  const column = [cell, cell, cell, cell, cell, cell, cell, cell]
//  const color_off = 5
//  const matrix_cell = {
//    color: color_off,
//    data: false,
//    onNoteOn: (msg, current_state) => {
//      const cell = current_state [i][j]
//      const new_state = 
//        changeCell
//          (i, j, current_state, {
//            ...cell,
//            color: cell [i][j].data ? color_off : color_on
//          })
//      ls_state_out$.next (new_state)
//      matrix_state_out$.next (
//        matrix_state_from_state (x, y, width, height, state)
//      )
//    }}
//    
//  t.deepEqual (
//    M.createMatrix (1, 2, 2, 2, color_off, 0, null, null, M.createState ()),
//    [
//      column, 
//      [matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell],
//      [matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell, matrix_cell],
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column, 
//      column])
//})
