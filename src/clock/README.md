# Clock module

Timing on frMIDI is based around MIDI timing messages. This allows using frMIDI as MIDI master clock or as MIDI clock receiver.

## Architecture

frMIDI separates timing into 3 parts:

### timer

The timer is an observable that generates an stream of arrays with two values:
```
[ current time, look ahead window ]
```

Those values are used in other parts of the library to generate correct timestamped messages or quantizing incoming messages.

As a look ahead interval is used, some messages are calculated in the future but will not be sended by the WebMIDI API until it's correct time.

Playing with timer's resolution and look ahead window size allows finding a good compromise between latency and responsiveness.

Timer's have no idea of tempo. One timer can be used to drive several MIDI clocks with different tempos.

As this implementation uses timestamps coming from timer (or from incoming midi messages) to calculate everything, to clocks connected to same timer will generate exactly the same MIDI Clock messages (if they are set to the same tempo and started at the same time, of course).

#### timer explanation

With a garbage collected language like JavaScript it's not easy to get ultra-precise timings based on the raw speed of the language. At any moment a delay can occur because of a garbage collection action.

After reading the article ["A Tale of Two Clocks - Scheduling Web Audio with Precision"](https://www.html5rocks.com/en/tutorials/audio/scheduling/) it became clear that to be able to obtain rock-solid timing a non-realtime approach was needed.

Precise timing is left to WebMIDI implementation by sending timestamped messages.

This was one of the main reasons to make this library completely (almost) functional, to be able to test correct timings based only on values.

### clock

The clock is an rxjs operator that generates MIDI Clock messages (understandable by this library but also by other MIDI devices) when receives timing info from a timer.

Tempo in MIDI is controlled by how fast MIDI Clock messages are sent. The clock has its own internal tempo (and does not depend on the timer's configuration) and will generate MIDI Clock messages with correct timestamps.

### transport

A transport allows playing, pausing, stopping and moving thru sequences. WIP.
