# frMIDI

JavaScript functional reactive MIDI library.

Functions are curried and parameters ordered for correct composing of functions.

Package is ready for node and browser usage (although on node WebMIDI API is not present and input/output functions can not be used without a plugin like jzz library).

# License

Originally, MIT license was used but as [midi-parse-js](https://github.com/colxi/midi-parser-js) is integrated in the project and it uses GNU GPL-3.0 license was changed to that.

# Installation

## In node

    npm install frmidi

## In the browser

	<script type="module">
	  import { initialize, logPorts } from 'https://unpkg.com/frmidi'

	  initialize ().then (logPorts)
	</script>

# Data types

# Recipes

## WebMIDI API initialization

	> import { initialize, logPorts } from 'frmidi'
	> initialize ()
	> logPorts ()

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20initialize,%20logPorts%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B45,0%5D%7D,%7B%22lines%22:%5B%22initialize%20()%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B13,0%5D%7D,%7B%22lines%22:%5B%22logPorts%20()%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B11,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:3%7D)

## Opening MIDI inputs and outputs

	> import { initialize, input, output } from 'frmidi'
	> initialize ()
	> var my_input = input ('Port-0')
	> var my_output = output ('Port-1')

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20initialize,%20input,%20output%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B50,0%5D%7D,%7B%22lines%22:%5B%22initialize%20()%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B13,0%5D%7D,%7B%22lines%22:%5B%22var%20my_input%20=%20input%20('Port-0')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B31,0%5D%7D,%7B%22lines%22:%5B%22var%20my_output%20=%20output%20('Port-1')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B33,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:4%7D)

## Dummy inputs and outputs

	> import { input, output } from 'frmidi'
	> var my_input = input ('dummy')
	> var my_output = output ('dummy')

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20input,%20output%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B38,0%5D%7D,%7B%22lines%22:%5B%22var%20my_input%20=%20input%20('dummy')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B30,0%5D%7D,%7B%22lines%22:%5B%22var%20my_output%20=%20output%20('dummy')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B32,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:3%7D)

## Connect MIDI input to MIDI output

As an input is an observable and and output is a function that accepts an observable as its parameter, we just need input function as parameter to output function to make a connection between them.

	> import { input, output } from 'frmidi'
	> var my_input = input ('dummy')
	> var my_output = output ('dummy')
	> var subscription = my_output (my_input)

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20input,%20output%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B38,0%5D%7D,%7B%22lines%22:%5B%22var%20my_input%20=%20input%20('dummy')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B30,0%5D%7D,%7B%22lines%22:%5B%22var%20my_output%20=%20output%20('dummy')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B32,0%5D%7D,%7B%22lines%22:%5B%22var%20subscription%20=%20my_output%20(my_input)%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B39,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:4%7D)

## Disconnecting MIDI input from MIDI output

	> import { input, output } from 'frmidi'
	> var my_input = input ('dummy')
	> var my_output = output ('dummy')
	> var subscription = my_output (my_input)
	> subscription.unsubscribe ()

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20input,%20output%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B38,0%5D%7D,%7B%22lines%22:%5B%22var%20my_input%20=%20input%20('dummy')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B30,0%5D%7D,%7B%22lines%22:%5B%22var%20my_output%20=%20output%20('dummy')%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B32,0%5D%7D,%7B%22lines%22:%5B%22var%20subscription%20=%20my_output%20(my_input)%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B39,0%5D%7D,%7B%22lines%22:%5B%22subscription.unsubscribe%20()%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B27,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:5%7D)

## Sending input messages programatically and inspecting output

Is it possible to simulate messages coming from an input by using next (msg) method from the input.
Also, we can inspect what's going out by subscribing to the output.

	> import { input, output, on } from 'frmidi'
	> var my_input = input ('dummy')
	… var my_output = output ('dummy')
	… my_output.subscribe (console.log)
	… my_output (my_input)
	… my_input.next (on (64))

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20input,%20output,%20on%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B42,0%5D%7D,%7B%22lines%22:%5B%22var%20my_input%20=%20input%20('dummy')%22,%22var%20my_output%20=%20output%20('dummy')%22,%22my_output.subscribe%20(console.log)%22,%22my_output%20(my_input)%22,%22my_input.next%20(on%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B23,4%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:2%7D)

## Filter note on/off messages

At this point is when true functionality of frMIDI is shown. Inputs are just observables and outputs are just observers. Between them we can use ReactiveX to do whatever we want with the streams.

	> import { input, output, on, off, cc, isNote } from 'frmidi'
	> import { filter } from 'rxjs/operators'
	> var my_input = input ('dummy')
	… var my_output = output ('dummy')
	… my_output.subscribe (console.log)
	… my_input.pipe (filter (isNote)).subscribe (my_output)
	… my_input.next (on (64))
	… my_input.next (cc (37))			// Rejected
	… my_input.next (off (64))

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20input,%20output,%20on,%20off,%20cc,%20isNote%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B59,0%5D%7D,%7B%22lines%22:%5B%22import%20%7B%20filter%20%7D%20from%20'rxjs/operators'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B39,0%5D%7D,%7B%22lines%22:%5B%22var%20my_input%20=%20input%20('dummy')%22,%22var%20my_output%20=%20output%20('dummy')%22,%22my_output.subscribe%20(console.log)%22,%22my_input.pipe%20(filter%20(isNote)).subscribe%20(my_output)%22,%22my_input.next%20(on%20(64))%22,%22my_input.next%20(cc%20(37))%22,%22my_input.next%20(off%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B24,6%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:3%7D)A

## Merging MIDI streams

Here we are going to filter notes on input1 and control messages on input2 and then merge both streams and send to output1.

	> import { input, output, isNote, isControlChange, on, off, cc } from 'frmidi'
	> import { merge } from 'rxjs'
	… import { filter } from 'rxjs/operators'
	> var input1 = input ('dummy')
	… var input2 = input ('dummy')
	… var output1 = output ('dummy')
	… output1.subscribe (console.log)
	… merge ( input1.pipe (filter (isNote)), input2.pipe (filter (isControlChange)) ).subscribe (output1)
	… input1.next (on (64))
	… input1.next (cc (37, 127))		// Rejected
	… input2.next (off (67))
	… input2.next (cc (47, 0))			// Rejected

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20input,%20output,%20isNote,%20isControlChange,%20on,%20off,%20cc%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B76,0%5D%7D,%7B%22lines%22:%5B%22import%20%7B%20merge%20%7D%20from%20'rxjs'%22,%22import%20%7B%20filter%20%7D%20from%20'rxjs/operators'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B39,1%5D%7D,%7B%22lines%22:%5B%22var%20input1%20=%20input%20('dummy')%22,%22var%20input2%20=%20input%20('dummy')%22,%22var%20output1%20=%20output%20('dummy')%22,%22output1.subscribe%20(console.log)%22,%22merge%20(%20input1.pipe%20(filter%20(isNote)),%20input2.pipe%20(filter%20(isControlChange))%20).subscribe%20(output1)%22,%22input1.next%20(on%20(64))%22,%22input1.next%20(cc%20(37,%20127))%22,%22input2.next%20(off%20(67))%22,%22input2.next%20(cc%20(47,%200))%22,%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B21,5%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:2%7D)

## Loading a MIDI file

frMIDI integrates midi-

# Modules

## Predicates

Predicates allow checking MIDI message characteristics.

Their name is self explanatory, only on those cases that was needed
some more documentation is added.

### Generic MIDI Message predicates

* seemsMIDIMessageAsArray (msg) => boolean
* seemsMIDIMessageAsObject (msg) => boolean
* seemsMIDIMessage (msg) => boolean
* seemsArrayOfMIDIMessagesAsArrays (msg) => boolean
* seemsArrayOfMIDIMessagesAsObjects (msg) => boolean
* dataEq (data, msg) => boolean
* byteEq (n, data, msg) => boolean
* dataEqBy (pred, msg) => boolean
* byteEqBy (n, pred, msg) => boolean

### Channel Voice Messages

* isChannelVoiceMessageOfType (type, msg) => boolean
* isNoteOff (msg) => boolean
* isNoteOn (msg) => boolean
* asNoteOn (msg) => boolean
* asNoteOff (msg) => boolean
* isNote (msg) => boolean
* hasVelocity (msg) => boolean
* velocityEq (v, msg) => boolean
* isPolyPressure (msg) => boolean
* hasNote (msg) => boolean
* noteEq (n, msg) => boolean
* isControlChange (msg) => boolean
* controlEq (c, msg) => boolean
* valueEq (v, msg) => boolean
* isProgramChange (msg) => boolean
* programEq (p, msg) => boolean
* isChannelPressure (msg) => boolean
* hasPressure (msg) => boolean
* pressureEq (p, msg) => boolean
* isPitchBend (msg) => boolean
* pitchBendEq (pb, msg) => boolean

### Channel Mode Messages

* isChannelModeMessage (d1, d2) => (msg) => boolean
* isAllSoundOff (msg) => boolean
* isResetAll (msg) => boolean
* isLocalControlOff (msg) => boolean
* isLocalControlOn (msg) => boolean
* isAllNotesOff (msg) => boolean
* isOmniModeOff (msg) => boolean
* isOmniModeOn (msg) => boolean
* isMonoModeOn (msg) => boolean
* isPolyModeOn (msg) => boolean
* isChannelMode (msg) => boolean
* isChannelVoice (msg) => boolean

### RPN & NRPN predicates

* isRPN (msg) => boolean
* isNRPN (msg) => boolean
* isChannelMessage (msg) => boolean
* isOnChannel (channel, msg) => boolean
* isOnChannels (channels, msg) => boolean

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

# Changelog

1.0.34 [2020/09/09] - When subscribing to an output, a correct MIDI message
  is now received instead of [msg_as_byte_array, timestamp].
1.0.33 [2020/09/09] - Changed logPorts function
1.0.32 [2020/09/09] - A message can be sent thru an input and it's
  also possible to subscribe to an output. Both for easy testing.
1.0.31 [2020/09/09] - Version number was incorrect
1.0.30 [2020/09/09] - Outputs are now subscribable for testing purposes
1.0.29 [2020/09/09] - Inputs can now emit events programatically for testing purposes.
