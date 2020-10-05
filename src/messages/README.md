# Messages module

frMIDI and specially this module has been highly influenced by [SendMIDI](https://github.com/gbevin/SendMIDI) and [ReceiveMIDI](https://github.com/gbevin/ReceiveMIDI). The command line of these tools is very well designed allowing very easy testing of MIDI devices from command line. This module has taken MIDI messages function creation names and inspiration from those tools.

The messages module does not depend on any other module from frMIDI.

## Message creation functions

All message functions accept optional timeStamp and deltaTime after their own specific parameters.

### Generic message creation utility functions

```msg (data: Array, ts: Number, dt: Number)```

```from (msg: Array | Object)```

### Channel Voice messages generation

#### Note Off

```off (note: 0-127, velocity: 0-127, channel: 0-15)```

#### Note On

```on (note: 0-127, velocity: 0.127, channel: 0-15)```

#### Poly Pressure

```pp (note: 0-127, pressure: 0-127, channel: 0-15)```

#### Control Change

```cc (control: 0-127, value: 0-127, channel: 0-15)```

#### Program Change

```pc (program: 0-127, channel: 0-15)```

#### Channel Pressure

```cp (pressure: 0-127, channel: 0-15)```

#### Pitch Bend

```pb (value: 0-16383, channel: 0-15)```

#### RPN & NRPN

```rpn (number: 0-16383, value: 0-16383, channel: 0-15)```

```nrpn (number: 0-16383, value: 0-16383, channel: 0-15)```

### System common messages generation

#### System Exclusive

```syx (data: Array)```

#### MIDI Time Code Quarter Frame

```tc (type: 0-7, value: 0-15)```

#### Song Position Pointer

```spp (number: 0-16383)```

#### Song Select

```ss (number: 0-127)```

#### Tune Request

```tun ()```

### System real time messages generation

#### Timing Clock

```mc ()```

#### Start

```start ()```

#### Continue

```cont ()```

#### Stop

```stop ()```

#### Active Sensing

```as ()```

#### Reset

```rst ()```

### Panic messages generation

Creates a note off for every note on every channel and also sends zero values to controllers 64 (Sustain Pedal), 120 (All Sound Off) and 123 (All Controllers Off).

```panic ()```

