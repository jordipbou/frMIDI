# frMIDI

JavaScript functional reactive MIDI library.

Functions are curried and parameters ordered for correct composing of functions.

# Installation

## In node

    npm install frmidi

## In the browser

    ...

# Modules

## Predicates

Predicates can be used for checking if a MIDI message is of some type
or has some characteristic equal to some value.

They are mainly used for filtering.

### Generic MIDI Message predicates

* seemsMIDIMessageAsArray (msg) : boolean
* seemsMIDIMessageAsObject (msg) : boolean
* seemsMIDIMessage (msg) : boolean
* seemsArrayOfMIDIMessagesAsArrays (msg) : boolean
* seemsArrayOfMIDIMessagesAsObjects (msg) : boolean
* dataEq (data, msg) : boolean
* byteEq (n, data, msg) : boolean
* dataEqBy (pred, msg) : boolean
* byteEqBy (n, pred, msg) : boolean

### Channel Voice Messages

* isChannelVoiceMessageOfType (type, msg) : boolean
* isNoteOff (msg) : boolean
* isNoteOn (msg) : boolean
* asNoteOn (msg) : boolean
* asNoteOff (msg) : boolean
* isNote (msg) : boolean
* hasVelocity (msg) : boolean
* velocityEq (v, msg) : boolean
* isPolyPressure (msg) : boolean
* hasNote (msg) : boolean
* noteEq (n, msg) : boolean
* isControlChange (msg) : boolean
* controlEq (c, msg) : boolean
* valueEq (v, msg) : boolean
* isProgramChange (msg) : boolean
* programEq (p, msg) : boolean
* isChannelPressure (msg) : boolean
* hasPressure (msg) : boolean
* pressureEq (p, msg) : boolean
* isPitchBend (msg) : boolean
* pitchBendEq (pb, msg) : boolean

### Channel Mode Messages

* isChannelModeMessage
* isAllSoundOff
* isResetAll
* isLocalControlOff
* isLocalControlOn
* isAllNotesOff
* isOmniModeOff
* isOmniModeOn
* isMonoModeOn
* isPolyModeOn
* isChannelMode
* isChannelVoice

### RPN & NRPN predicates

* isRPN
* isNRPN
* isChannelMessage
* isOnChannel
* isOnChannels

### System Common message predicates

* isSystemExclusive
* isMIDITimeCodeQuarterFrame
* isSongPositionPointer
* isSongSelect
* isTuneRequest
* isEndOfExclusive

### System Real Time message predicates

* isMIDIClock
* isStart
* isContinue
* isStop
* isActiveSensing
* isReset

### MIDI File Meta Events predicates

* seemsMIDIMetaEventArray
* seemsMIDIMetaEventObject
* seemsMIDIMetaEvent
* metaTypeEq
* isTempoChange

## Messages

## Lenses

## Clock

## MidiFile

## I/O

The input/output module contains functions to interact with the outer world.

initialize (sysex = false, custom_navigator = window.navigator)

  Initializes WebMIDI API.

logPorts ()

  Logs every input/output MIDI port to console.

input (name)

  Returns first MIDI input that contains name as an observable.

output (name)

  Returns first MIDI output that contains name as an observer

# Recipes

## Connect MIDI input to MIDI output

As an input is an observable and and output accepts an observable as
its parameter, we just need input function as parameter to output
function.

In this example, I have connected input from 'Port-1' to output of 'Port-14'. When I send MIDI from the outside to Port-1 its redirected to Port-14 directly.

    > import * from 'frmidi'
    > initialize ()
    …   .then (() => output ('Port-14') 
    …                       (input ('Port-1')))

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20*%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B22,0%5D%7D,%7B%22lines%22:%5B%22initialize%20()%22,%22%20%20.then%20(%20()%20=%3E%20output%20('Port-14')%20(input%20('Port-1'))%20)%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B55,1%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:2%7D)

## Filter note on/off messages

As input are observables and output observers we can use just regular rxjs elements to test. (No need to initialize WebMIDI API)

    > import { Subject } from 'rxjs'
	… import { filter } from 'rxjs/operators'
	… import { isNote, cc, on, off } from 'frmidi'
	> var s = new Subject ()
	… s.pipe (filter (isNote)).subscribe (console.log)
	… s.next (on (64))
	… s.next (cc (37))
	… s.next (off (64))

On console can be seen that cc MIDI message has been rejected.

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20isNote,%20cc,%20on,%20off%20%7D%20from%20'frmidi'%22,%22import%20%7B%20Subject%20%7D%20from%20'rxjs'%22,%22import%20%7B%20filter%20%7D%20from%20'rxjs/operators'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B39,2%5D%7D,%7B%22lines%22:%5B%22let%20s%20=%20new%20Subject%20()%22,%22s.pipe%20(filter%20(isNote)).subscribe%20(console.log)%22,%22%22,%22s.next%20(on%20(64))%22,%22s.next%20(cc%20(37))%22,%22s.next%20(off%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B22,0%5D%7D%5D,%22focused%22:0%7D)

To make it more clear how to use it with real MIDI inputs and outputs, see next example (in1 can be any external input -like a MIDI keyboard-. I have connected outside the browser out0 to in1 for testing.)

	> import { cc, initialize, input, isNote, on, off, output } from 'frmidi'
	… import { filter, tap } from 'rxjs/operators'
	> initialize ()
	> var in1 = input ('Port-1')
	> var out14 = output ('Port-14')
	> in1.pipe (filter (isNote), tap (console.log)).subscribe (out14)
	> var out0 = output ('Port-0')
	> out0 (on (64))
	> out0 (cc (37))
	> out0 (off (64))
 
[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20cc,%20initialize,%20input,%20isNote,%20on,%20off,%20output%20%7D%20from%20'frmidi'%22,%22import%20%7B%20filter,%20tap%20%7D%20from%20'rxjs/operators'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%22filter%22%5D,%22autocompletion%22:%22er%22,%22cursor%22:%5B13,1%5D%7D,%7B%22lines%22:%5B%22initialize%20()%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B13,0%5D%7D,%7B%22lines%22:%5B%22var%20in1%20=%20input%20('Port-1')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B26,0%5D%7D,%7B%22lines%22:%5B%22var%20out14%20=%20output%20('Port-14')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B30,0%5D%7D,%7B%22lines%22:%5B%22in1.pipe%20(filter%20(isNote),%20tap%20(console.log)).subscribe%20(out14)%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B63,0%5D%7D,%7B%22lines%22:%5B%22var%20out0%20=%20output%20('Port-0')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B28,0%5D%7D,%7B%22lines%22:%5B%22out0%20(on%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B14,0%5D%7D,%7B%22lines%22:%5B%22out0%20(cc%20(37))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B14,0%5D%7D,%7B%22lines%22:%5B%22out0%20(off%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B15,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:9%7D)

## Merging MIDI streams

# Changelog

1.0.30 [2020/09/09] - Outputs are now subscribable for testing purposes
1.0.29 [2020/09/09] - Inputs can now emit events programatically for testing purposes.
