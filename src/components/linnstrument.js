import { cc, from } from '../messages/messages.js'
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

// Each cell of state expects an object with:
// onNoteOn
// onNoteOff
// onPitchBend
// onTimbre
// onPressure
// status
export const createState = () =>
  R.map 
    ((x) => R.map ((y) => ({ color: OFF })) (R.range (0, 8))) 
    (R.range (0, 17))

export const changeState = (output$) => (state$) =>
  state$.subscribe ((state) => 
    R.addIndex (R.forEach)
      ((column, x) => 
        R.addIndex (R.forEach)
          ((row, y) =>
            output$.next (setColor (x, y, state [x][y])))
          (column))
      (state))

export const listener = R.curry ((state, input) => {
  input.pipe (
    O.filter (M.isNoteOn),
  ).subscribe ((v) => {
      let x = R.view (M.note) (v)
      let y = R.view (M.channel) (v)

      if (state [x][y].onNoteOn !== undefined)
        state [x][y].onNoteOn (v, state [x][y].status)

      if (state [x][y].onPitchBend !== undefined)
        state [x][y].unsubscriberPitchBend = 
          input.pipe (
            O.filter (
              R.both (
                M.isPitchBend,
                M.isOnChannel (R.view (M.channel) (v))
              )
            )
          ).subscribe (
			(v) => state [x][y].onPitchBend (v, state [x][y].status))

      if (state [x][y].onTimbreChange !== undefined)
        state [x][y].unsubscriberTimbreChange = 
          input.pipe (
            O.filter (
              R.both (
                M.isTimbreChange,
                M.isOnChannel (R.view (M.channel) (v))
              )
            )
          ).subscribe (
			(v) => state [x][y].onTimbreChange (v, state [x][y].status))

      if (state [x][y].onPressure !== undefined)
        state [x][y].unsubscriberPressure =
          input.pipe 
            (O.filter 
              (R.both 
                (M.isPolyPressure)
                (M.isOnChannel (R.view (M.channel) (v)))
              )
            ).subscribe (
				(v) => state [x][y].onPressure (v, state[x][y].status))

      // Note off and cleaning
      state[x][y].unsubscriberNoteOff =
        input.pipe 
          (O.filter 
            (R.both 
              (M.isNoteOff)
              (M.isOnChannel (R.view (M.channel) (v))))
          ).subscribe ((v) => {
            if (state [x][y].onNoteOff !== undefined)
              state [x][y].onNoteOff (v, state[x][y].status)

            if (state [x][y].unsubscriberPitchBend !== undefined) {
              state [x][y].unsubscriberPitchBend.unsubscribe ()
              state [x][y].unsubscriberPitchBend = undefined
            }

            if (state [x][y].unsubscriberTimbreChange !== undefined) {
              state [x][y].unsubscriberTimbreChange.unsubscribe ()
              state [x][y].unsubscriberTimbreChange = undefined
            }

            if (state [x][y].unsubscriberPressure !== undefined) {
              state [x][y].unsubscriberPressure.unsubscribe ()
              state [x][y].unsubscriberPressure = undefined
            }

            if (state [x][y].unsubscriberNoteOff !== undefined) {
              state [x][y].unsubscriberNoteOff.unsubscribe ()
              state [x][y].unsubscriberNoteOff = undefined
            }
          }) 
  })
})

export const createLambdaToggle = R.curry (
  (x, y, color_off, color_on, lambda_on, lambda_off, lout, state) => {
    lout (setColor (x, y, color_off))
  
    state[x][y] = {
      status: { toggled: false },
      onNoteOn: (v, status) => {
        status.toggled = !status.toggled
  
        if (status.toggled) {
          lambda_on ()
          lout (setColor (x, y, color_on))
        } else {
          lambda_off ()
          lout (setColor (x, y, color_off))
        }
      }
    }
  
    return state
  })

export const createToggle = R.curry (
  (x, y, color_off, color_on, msg_off, msg_on, lout, sout, state) =>
    createLambdaToggle 
      (x) (y) 
      (color_off) (color_on) 
      (() => sout (R.set (M.channel) (1) (msg_on))) 
      (() => sout (R.set (M.channel) (1) (msg_off))) 
      (lout) 
      (state))
  
export const createCC14bit = R.curry (
  (x, y, color, ch, cc, lout, sout, state) => {
    lout (setColor (x, y, color))
  
    state[x][y] = {
      status: { 
          value: 8192,
          tempPB: 8192,
          pressure: 0,
      },
      onPressure: (v, status) => {
        status.pressure = v.data [2]
      },
      onPitchBend: (v, status) => {
        let mod = status.pressure < 96 ? 0.01 : 1 //(status.pressure < 112 ? 1 : 12)
        let pb = M.value14bit (v.data [2], v.data [1])
  
        let diff = pb - status.tempPB
        status.tempPB = pb
  
        status.value = 
          Math.round (
            R.clamp (
              0, 
              16383, 
              status.value + diff * mod))
  
        sout (
          M.cc14bit (
            cc, 
            status.value))
      },
      onNoteOff: (v, status) => {
        status.tempPB = 8192
      }
    }
  
    return state
  })
