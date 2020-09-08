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

[Load on Efimera](https://jordipbou.github.com/efimera/?json={"blocks":[{"lines":["import * from 'frmidi'"],"history":[],"completions":[],"autocompletion":"","cursor":[22,0]},{"lines":["initialize ()","  .then ( () => output ('Port-14') (input ('Port-1')) )"],"history":[],"completions":[],"autocompletion":"","cursor":[55,1]},{"lines":[""],"history":[],"completions":[],"autocompletion":"","cursor":[0,0]}],"focused":2})


