import * as R from 'ramda'
import * as X from 'rxjs'
import * as O from 'rxjs/operators'

// A controller state receives input from the hardware controller (like
// movement of a knob, press of a key or a button, etc) and also can
// receive feedback input from elsewhere that needs to update the
// physical controller state. Only when modifying something in the process
// or receiving from software the physical controller should be updated.

// Let's start with CCs 0-127.
