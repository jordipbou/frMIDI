# frMIDI

Functional reactive MIDI ES6 library.

# Modules

## Predicates

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
	> import { filter } from 'rxjs/operators'
	> import { isNote, cc, on, off } from 'frmidi'
	> var s = new Subject ()
	> s.pipe (filter (isNote)).subscribe (console.log)
	> s.next (on (64))
	> s.next (cc (37))
	> s.next (off (64))

On console can be seen that cc MIDI message has been rejected.

[Load on Efimera](https://jordipbou.github.com/efimera/?json=%7B%22blocks%22:%5B%7B%22lines%22:%5B%22import%20%7B%20Subject%20%7D%20from%20'rxjs'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D,%7B%22lines%22:%5B%22import%20%7B%20filter%20%7D%20from%20'rxjs/operators'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B39,0%5D%7D,%7B%22lines%22:%5B%22import%20%7B%20isNote,%20cc,%20on,%20off%20%7D%20from%20'frmidi'%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B44,0%5D%7D,%7B%22lines%22:%5B%22var%20s%20=%20new%20Subject%20()%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B22,0%5D%7D,%7B%22lines%22:%5B%22s.pipe%20(filter%20(isNote)).subscribe%20(console.log)%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B48,0%5D%7D,%7B%22lines%22:%5B%22s.next%20(on%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B16,0%5D%7D,%7B%22lines%22:%5B%22s.next%20(cc%20(37))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B16,0%5D%7D,%7B%22lines%22:%5B%22s.next%20(off%20(64))%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B17,0%5D%7D,%7B%22lines%22:%5B%22%22%5D,%22history%22:%5B%5D,%22completions%22:%5B%5D,%22autocompletion%22:%22%22,%22cursor%22:%5B0,0%5D%7D%5D,%22focused%22:8%7D)
