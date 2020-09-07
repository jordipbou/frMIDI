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

