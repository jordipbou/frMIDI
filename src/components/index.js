export {
  routing_matrix,
  seamless_routing_matrix,
  CC14bitFromCCs,
  CCsFromCC14bit
} from './components.js'

export {
  AS_SETTINGS,
  RED,
  YELLOW,
  GREEN,
  CYAN,
  BLUE,
  MAGENTA,
  OFF,
  WHITE,
  ORANGE,
  LIME,
  PINK,

  setColor,
  clear,
  restore,

  userFirmwareMode,
  rowSlide,
  xData,
  yData,
  zData,
  decimationRate,
  fullUserFirmwareMode,

  createState,
  getCell,
  adjustCell,
  assocCell,
  dissocCell,
  evolveCell,
  changeState,
  
  createToggle,
  createRoutingMatrix,

  createListener,
} from './linnstrument.js'
