// TODO: For some reason, withLatestFrom on noteon/noteoff/... subscribers
// is not using last sent state on newstate$, 
// but previous (or even initial) state only

import * as M from '../messages/index.js'
import * as P from '../predicates/index.js'
import * as L from '../lenses/index.js'
import * as R from 'ramda'
import * as X from 'rxjs'
import * as O from 'rxjs/operators'

export const AS_SETTINGS = 0
export const RED = 1
export const YELLOW = 2
export const GREEN = 3
export const CYAN = 4
export const BLUE = 5
export const MAGENTA = 6
export const OFF = 7
export const WHITE = 8
export const ORANGE = 9
export const LIME = 10
export const PINK = 11

// -------------------------------------  Setting color of cells
// It's not needed to set user firmware mode to change colors.

export const setColor = R.curry ((x, y, c) =>
  M.from ([
    M.cc (20, x),
    M.cc (21, y),
    M.cc (22, c)
  ]))

export const clear = (c = 7) =>
  X.from (
    R.flatten (
      R.map ((x) =>
        R.map ((y) => setColor (x, y, c)) (R.range (0, 8))
        ) (R.range (0, 17))))

export const restore = () =>
  clear (AS_SETTINGS)

// ------------------------------------------- User firmware mode

export const userFirmwareMode = (enable) =>
	M.nrpn (245, enable ? 1 : 0)

export const rowSlide = R.curry ((row, enable) => 
	M.cc (9, enable ? 1 : 0, row))

export const xData = R.curry ((row, enable) =>
	M.cc (10, enable ? 1 : 0, row))

export const yData = R.curry ((row, enable) =>
	M.cc (11, enable ? 1 : 0, row))

export const zData = R.curry ((row, enable) =>
	M.cc (12, enable ? 1 : 0, row))

export const decimationRate = (rate = 12) =>
	M.cc (13, rate)

export const fullUserFirmwareMode = (enable) =>
  M.from ([
    userFirmwareMode (enable),
    ...R.map ((r) => xData (r) (enable)) (R.range (0, 8)),
    ...R.map ((r) => rowSlide (r) (enable)) (R.range (0, 8)),
    ...R.map ((r) => yData (r) (enable)) (R.range (0, 8)),
    ...R.map ((r) => zData (r) (enable)) (R.range (0, 8))
  ])

// -------- States (screens) for LinnStrument controller creation

export const createState = (width = 17, height = 8) => ({
  ownedNotes: [],
  cells: R.map 
           ((x) => 
             R.map 
               ((y) => ({ color: OFF })) 
               (R.range (0, height))) 
           (R.range (0, width))
})

export const ownNote = R.curry ((note, channel, x, y, state) =>
  R.evolve ({
    ownedNotes: R.append ({ note, channel, x, y })
  }) (state))

export const disownNote = R.curry ((note, channel, state) =>
  R.evolve ({
    ownedNotes: R.reject ((o) => o.note === note && o.channel === channel)
  }) (state))

export const getCell = R.curry ((x, y, st) =>
  st.cells [x][y])

export const getOwnerCell = R.curry ((x, y, st) => {
  const ownedNote =
    R.head 
      (R.filter 
        ((o) => o.note === x && o.channel === y) 
        (st.ownedNotes))

  if (ownedNote !== undefined) {
    x = ownedNote.x
    y = ownedNote.y
  }

  return st.cells [x][y]
})

export const adjustCell = R.curry ((x, y, fn, st) =>
  R.evolve ({
    cells: R.adjust (x) ((col) => R.adjust (y) ((cell) => fn (cell)) (col))
  }) (st))

export const assocCell = R.curry ((x, y, property, value, st) =>
  adjustCell (x, y, R.assoc (property) (value), st))

export const dissocCell = R.curry ((x, y, property, st) =>
  adjustCell (x, y, R.dissoc (property), st))

export const evolveCell = R.curry ((x, y, transformation, st) =>
  adjustCell (x, y, R.evolve (transformation), st))

export const colorsFromState = (state) =>
  R.flatten 
    (R.addIndex (R.map)
      ((column, i) =>
        R.addIndex (R.map)
          ((cell, j) =>
            setColor (i, j, cell.color))
          (column))
      (state.cells))

export const changeState = (state, old_state = state) =>
  M.from
    (R.map
      (([a, b]) => a)
      (R.filter
        (([a, b]) => state === old_state || !(R.equals (a, b)))
        (R.zip
          (colorsFromState (state))
          (colorsFromState (old_state)))))

export const stateChanger = () =>
  X.pipe (
    O.scan (
      ([old_state, _], state) => [state, changeState (state, old_state)],
      [undefined, null]
    ),
    O.map (([_, stateChanges]) => stateChanges)
  )
  
// -------------------------------------------------- State logic

export const subscribeNotesOn = (state$, newstate$, lsin$) =>
  lsin$.pipe (
    O.filter (P.isNoteOn),
    O.withLatestFrom (state$)
  ).subscribe (([msg, state]) => {
    const x = R.view (L.note) (msg)
    const y = R.view (L.channel) (msg)

    const cell = getOwnerCell (x) (y) (state)

    state = cell.onNoteOn && cell.onNoteOn (msg, state)

    state && newstate$.next (state)
  })

export const subscribeNotesOff = (state$, newstate$, lsin$) =>
  lsin$.pipe (
    O.filter (P.isNoteOff),
    O.withLatestFrom (state$)
  ).subscribe (([msg, state]) => {
    const x = R.view (L.note) (msg)
    const y = R.view (L.channel) (msg)

    const cell = getOwnerCell (x) (y) (state)

    state = cell.onNoteOff && cell.onNoteOff (msg, state)

    state && newstate$.next (state)
  })

export const subscribeRowSlide = (state$, newstate$, lsin$) =>
  lsin$.pipe (
    O.filter (P.controlEq (119)),
    O.withLatestFrom (state$)
  ).subscribe (([msg, state]) => {
    const x = R.view (L.note) (msg)
    const y = R.view (L.channel) (msg)

    const cell = getOwnerCell (x) (y) (state)

    state = cell.onRowSlide && cell.onRowSlide (msg, state)

    state && newstate$.next (state)
  })

//export const subscribeXData = (state$, newstate$, lsin$) =>
//  // TODO: We need to listen to controls 0-25 for MSB and
//  // join with controls 32-57 for its LSB !! (use M.byteEqBy)
//  lsin$.pipe (
//    O.filter (M.controlEq (119)),
//    O.withLatestFrom (state$)
//  ).subscribe (([msg, state]) => {
//    const x = R.view (M.note) (msg)
//    const y = R.view (M.channel) (msg)
//
//    const cell = getOwnerCell (x) (y) (state)
//
//    state = cell.onRowSlide && cell.onRowSlide (msg, state)
//
//    state && newstate$.next (state)
//  })

//export const subscribeYData = (state$, newstate$, lsin$) =>
//  // TODO: We need to listen to controls 64-89 (use M.byteEqBy)
//  lsin$.pipe (
//    O.filter (M.controlEq (119)),
//    O.withLatestFrom (state$)
//  ).subscribe (([msg, state]) => {
//    const x = R.view (M.note) (msg)
//    const y = R.view (M.channel) (msg)
//
//    const cell = getOwnerCell (x) (y) (state)
//
//    state = cell.onRowSlide && cell.onRowSlide (msg, state)
//
//    state && newstate$.next (state)
//  })

export const subscribeZData = (state$, newstate$, lsin$) =>
  lsin$.pipe (
    O.filter (P.isPolyPressure),
    O.withLatestFrom (state$)
  ).subscribe (([msg, state]) => {
    const x = R.view (L.note) (msg)
    const y = R.view (L.channel) (msg)

    const cell = getOwnerCell (x) (y) (state)

    state = cell.onZData && cell.onZData (msg, state)

    state && newstate$.next (state)
  })


export const listener = (state$, lsin$) => {
  // When a new state, either from state$ or from newstate$ arrives,
  // it has to be the latest merged to incoming data from lsin$
  const newstate$ = new X.Subject ()
  const laststate$ = X.merge (state$, newstate$)

  const noteOnListener = subscribeNotesOn (laststate$, newstate$, lsin$)
  const noteOffListener = subscribeNotesOff (laststate$, newstate$, lsin$)
  const rowSlideListener = subscribeRowSlide (laststate$, newstate$, lsin$)
  //const xDataListener = subscribeXData (laststate$, newstate$, lsin$)
  //const yDataListener = subscribeYData (laststate$, newstate$, lsin$)
  const zDataListener = subscribeZData (laststate$, newstate$, lsin$)

  return {
    newstate$: laststate$,
    unsubscribe: () => {
      newstateListener.unsubscribe ()
      noteOnListener.unsubscribe ()
      noteOffListener.unsubscribe ()
      rowSlideListener.unsubscribe ()
      xDataListener.unsubscribe ()
      yDataListener.unsubscribe ()
      zDataListener.unsubscribe ()
    }
  }
}

export const createListener = 
  R.curry ((state$, lsin$, lsout$) => {
    lsout$ (userFirmwareMode (true))
    return listener (state$, lsin$)
  })

// --------------------------------------------- State creation helpers

export const createToggle = 
  R.curry ((x, y, color_off, color_on, lambda, state) => 
    adjustCell
      (x) (y)
      (() => ({
        color: color_off,
        data: false,
        onNoteOn: (msg, state) => {
          lambda () 
          return ownNote 
            (x) (y)
            (x) (y)
            (adjustCell
              (x) (y)
              ((cell) => R.evolve ({
                color: () => cell.data ? color_off : color_on,
                data: R.not
              }) (cell))
              (state))
        },
        onNoteOff: (msg, state) =>
          disownNote
            (x) (y)
            (state)
      }))
      (state))

// Activating a button deactivates the others in the group,
// like a track selector.
export const createRadioButtons = 
  R.curry ((x, y, w, h, color_off, color_on, lambda, state) => {
    // TODO
  })

// Creates a button with one option on press/release and one
// option when sliding to a neighbouring cell.
//export const createCircularButton =

//export const createVerticalSlider =

//export const createHorizontalSlider =

export const createRoutingMatrix =
  R.curry ((x, y, w, h, color_off, color_on, matrix_state$, state) => {
    let matrix_state = R.repeat (R.repeat (false) (w)) (h)

    for (let i = x; i < x + w; i++) {
      for (let j = y; j < y + h; j++) {
        state = 
          createToggle 
            (i) (j) 
            (color_off) (color_on)
            (() => {
              matrix_state = 
                R.adjust
                  (j - y) 
                  (R.adjust
                    (i - x)
                    ((v) => !v))
                  (matrix_state)

              matrix_state$.next (matrix_state)
            })
            (state)
      }
    }

    return state
  })
  
//const matrix_state_from_state = (x, y, width, height) => (state) => 
//  R.map
//    ((i) => 
//      R.map 
//        ((j) => state [i][j].data)
//        (R.range (y, y + width)))
//    (R.range (x, x + width))
//
//export const evolveState = (x, y, width, height, state) =>
//  matrix_state_from_state (x, y, width, height)
//
//export const matrixCellOnNoteOn = 
//  (i, j, color_off, color_on, evolve_state) =>
//    (msg, current_state) => {
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
//    }
//    }
//
//export const createMatrix = R.curry (
//  (x, y, width, height,
//   color_off, color_on,
//   matrix_state_out$, ls_state_out$,
//   state) =>
//    R.reduce
//      ((st, i) => 
//        R.reduce
//          ((st, j) => 
//            changeCell 
//              (i, j, st)
//              ({
//                color: color_off,
//                data: false,
//                onNoteOn: (msg, current_state) => {
//                  const cell = current_state [i][j]
//                  const new_state = 
//                    changeCell
//                      (i, j, current_state, {
//                        ...cell,
//                        color: cell [i][j].data ? color_off : color_on
//                      })
//                  ls_state_out$.next (new_state)
//                  matrix_state_out$.next (
//                    matrix_state_from_state (x, y, width, height, state)
//                  )
//                }
//              }))
//          (st)
//          (R.range (y, y + height)))
//      (state)
//      (R.range (x, x + width)))


//export const createLambdaToggle = R.curry (
//  (x, y, color_off, color_on, lambda_on, lambda_off, lout, state) => {
//    lout (setColor (x, y, color_off))
//  
//    state[x][y] = {
//      status: { toggled: false },
//      onNoteOn: (v, status) => {
//        status.toggled = !status.toggled
//  
//        if (status.toggled) {
//          lambda_on ()
//          lout (setColor (x, y, color_on))
//        } else {
//          lambda_off ()
//          lout (setColor (x, y, color_off))
//        }
//      }
//    }
//  
//    return state
//  })
//
//export const createToggle = R.curry (
//  (x, y, color_off, color_on, msg_off, msg_on, lout, sout, state) =>
//    createLambdaToggle 
//      (x) (y) 
//      (color_off) (color_on) 
//      (() => sout (R.set (M.channel) (1) (msg_on))) 
//      (() => sout (R.set (M.channel) (1) (msg_off))) 
//      (lout) 
//      (state))
//  
//export const createCC14bit = R.curry (
//  (x, y, color, ch, cc, lout, sout, state) => {
//    lout (setColor (x, y, color))
//  
//    state[x][y] = {
//      status: { 
//          value: 8192,
//          tempPB: 8192,
//          pressure: 0,
//      },
//      onPressure: (v, status) => {
//        status.pressure = v.data [2]
//      },
//      onPitchBend: (v, status) => {
//        let mod = status.pressure < 96 ? 0.01 : 1 //(status.pressure < 112 ? 1 : 12)
//        let pb = M.value14bit (v.data [2], v.data [1])
//  
//        let diff = pb - status.tempPB
//        status.tempPB = pb
//  
//        status.value = 
//          Math.round (
//            R.clamp (
//              0, 
//              16383, 
//              status.value + diff * mod))
//  
//        sout (
//          M.cc14bit (
//            cc, 
//            status.value))
//      },
//      onNoteOff: (v, status) => {
//        status.tempPB = 8192
//      }
//    }
//  
//    return state
//  })

//const matrix_state_from_state = (x, y, width, height) => (state) => 
//  R.map
//    ((i) => 
//      R.map 
//        ((j) => state [i][j].data)
//        (R.range (y, y + width)))
//    (R.range (x, x + width))
//
//export const evolveState = (x, y, width, height, state) =>
//  matrix_state_from_state (x, y, width, height)
//
//export const matrixCellOnNoteOn = 
//  (i, j, color_off, color_on, evolve_state) =>
//    (msg, current_state) => {
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
//    }
//    }
//
//export const createMatrix = R.curry (
//  (x, y, width, height,
//   color_off, color_on,
//   matrix_state_out$, ls_state_out$,
//   state) =>
//    R.reduce
//      ((st, i) => 
//        R.reduce
//          ((st, j) => 
//            changeCell 
//              (i, j, st)
//              ({
//                color: color_off,
//                data: false,
//                onNoteOn: (msg, current_state) => {
//                  const cell = current_state [i][j]
//                  const new_state = 
//                    changeCell
//                      (i, j, current_state, {
//                        ...cell,
//                        color: cell [i][j].data ? color_off : color_on
//                      })
//                  ls_state_out$.next (new_state)
//                  matrix_state_out$.next (
//                    matrix_state_from_state (x, y, width, height, state)
//                  )
//                }
//              }))
//          (st)
//          (R.range (y, y + height)))
//      (state)
//      (R.range (x, x + width)))
