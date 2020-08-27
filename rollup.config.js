import babel from "rollup-plugin-babel";
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [{
  input: "./src/index.js",
  output: {
    file: "./es/frmidi.js",
    format: "es",
    name: "frmidi"
  },
  plugins: [
    babel ({
      exclude: "node_modules/**"
    }),
    nodeResolve ()
]}, {
  input: "./src/index.js",
  output: {
    file: "./umd/frmidi.js",
    format: "umd",
    name: "frmidi"
  },
  plugins: [
    babel ({
      exclude: "node_modules/**"
    }),
    nodeResolve ()
]}]
  
