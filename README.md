# frMIDI

JavaScript functional reactive MIDI library for WebMIDI applications.

## Why reactive?

Reactive programming offers a similar feeling to using cables. Things are connected and data flows throw them. Also, a lot of typical MIDI processing seems very similar to what reactive frameworks offer: filtering messages, mapping one type of message to another, adapting values, etc.

It's difficult with current tools to process MIDI in the time-domain. Using rxjs (or other reactive frameworks) allows using already created and tested functions that work in time-domain in an easier way, allowing things like buffering or maintaining state a lot easier.

## Why functional?

Not being able of trusting the language virtual machine for rock-solid precise timing, and after reading ["A Tale of Two Clocks - Scheduling Web Audio with Precision"](https://www.html5rocks.com/en/tutorials/audio/scheduling/), it became clear that to be able to have rock-solid timing precise MIDI message timestamps were necessary.

Unit Testing is a great tool to check valid timestamps in this case, and functional programming allows easier testing by allowing easier function composition.

[Ramda](https://ramdajs.com) library has become a fundamental tool in the process. 

# Installation

## In node

    npm install frmidi

For input/output in node it's necessary to use JZZ library navigator implementation.

## In the browser

	<script type="module">
	  import { initialize, logPorts } from 'https://unpkg.com/frmidi'

	  initialize ().then (logPorts)
	</script>

# Modules

* [Predicates](./src/predicates/README.md)
* [Messages](./src/messages/README.md)
* [Lenses](./src/lenses/README.md)
* [Clock](./src/clock/README.md)
* [Sequences](./src/sequences/README.md)
* [MPE](./src/mpe/README.md)
* [I/O](./src/io/README.md)

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

## Loading and playing MIDI file

frMIDI integrates [colxi/midi-parser-js](https://github.com/colxi/midi-parser-js) for working with midi files.



## More complex filtering

Filtering note on/off that has velocity between 64 and 96.

	> in.pipe (rxo.filter (R.allPass ([isNote, 
	…                                  lensP (velocity, R.gte, 64), 
	…                                  lensP (velocity, R.lte, 96)])))
	…   .subscribe (console.log)


# License

frMIDI is open-sourced software licensed under GNU GPL-3.0 license.

(Originally, MIT license was used but it was not compatible with integrating [colxi/midi-parser-js](https://github.com/colxi/midi-parser-js) library, so it was changed to GNU GPL-3.0)

# Changelog

* 1.0.58 [2021/03/27] - seemsMessage was not working correctly with MIDIMessageEvent
* 1.0.57 [2021/03/26] - Modified code for seemsMessage to make it fast as it was bottlenecking the rest of functions.
* 1.0.56 [2021/03/10] - Added 14bit CC and msb, lsb and value14bit functions.
* 1.0.55 [2020/11/20] - Playing sequences now works correctly again. Changed clock to not forward tempo change messages, it generated problems with play as its sended to a previous subject to make the clock receive it and then was forwarded to play again who sended it to clock.
* 1.0.54 [2020/11/19] - Added functions to manipulate sequences. Modified pattern to allow multiple bars on definitions. Modified metronome to be based on new functions.
* 1.0.53 [2020/11/10] - Removed absolute delta times from sequences. Used only for internal processing, it was more complicated to work with.
* 1.0.52 [2020/11/04] - Added absolute delta times on loadMIDIFile conversion to always work with both deltaTimes and absoluteDeltaTimes.
* 1.0.51 [2020/10/19] - Added metronome operator. Sends different notes on channel 10 for first beat, subdivision and rest of beats.
* 1.0.50 [2020/10/13] - Added play function, uses timer, clock and player under the hood and returns an observable that can be directly sent to an output or subscribed to (in both cases returning unsubscription objects)
* 1.0.49 [2020/10/11] - player operator works correctly with loops now.
* 1.0.48 [2020/10/11] - player operator now responds to start, stop and continue messages. Also forwards any message that is not one of previous messages or MIDIClock messages.
* 1.0.47 [2020/10/09] - Correction on previous upload.
* 1.0.46 [2020/10/09] - LoadMIDIFile was not setting type as 'midimessage' on conversion. (sequence) player working (but not for loops).
* 1.0.45 [2020/10/08] - Forgot timeDivision on MIDI File.
* 1.0.44 [2020/10/08] - In the process of rewriting sequence stuff, modified loadMidiFile to adapt format to new sequence format. Removed the possibility of using arrays of messages.
* 1.0.43 [2020/10/05] - Big refactor. Some modules moved to its own directory, this way it will be possible to export functions for testing but don't export for public API. Everything related to MIDI File refactored to Sequence.
* 1.0.42 [2020/10/04] - Moved clock functions from helper to clock.js. Added tests for rxjs based code. Reworked lookAheadClock.
* 1.0.41 [2020/09/30] - Added playMIDIFile function.
* 1.0.40 [2020/09/29] - Working MIDI file playing functionality.
* 1.0.39 [2020/09/29] - Added default values for most message creation functions to not end with an invalid MIDI message in any case.
* 1.0.38 [2020/09/29] - Added channelByKeyRange algorithm. Allows selection of mpe zone channel having into account predefined key ranges mapped to different channels (can overlap) sorted by a predefined weight (priority) and by least notes on channel.
* 1.0.37 [2020/09/25] - Better support to use mpe zones. Allows toMPE helper to select algorithm for channel selection. Current implemented algorithm selects channel sorting by least notes on channel.
* 1.0.36 [2020/09/21] - Arrays are not accepted as MIDI messages now, only correct objects. It makes library easier and takes out a lot of checks for correct MIDI messages.
* 1.0.35 [2020/09/20] - Added toMPE helper. Allows sending one channel inputs to MPE zone channels maintaining state of active notes.
* 1.0.34 [2020/09/09] - When subscribing to an output, a correct MIDI message is now received instead of [msg_as_byte_array, timestamp].
* 1.0.33 [2020/09/09] - Changed logPorts function
* 1.0.32 [2020/09/09] - A message can be sent thru an input and it's also possible to subscribe to an output. Both for easy testing.
* 1.0.31 [2020/09/09] - Version number was incorrect
* 1.0.30 [2020/09/09] - Outputs are now subscribable for testing purposes
* 1.0.29 [2020/09/09] - Inputs can now emit events programatically for testing purposes.
