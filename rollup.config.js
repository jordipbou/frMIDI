import babel from "rollup-plugin-babel";
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: "./src/index.js",
  output: {
    file: "./lib/index.js",
    format: "umd",
    name: "frmidi"
  },
  plugins: [
    babel ({
      exclude: "node_modules/**"
    }),
    nodeResolve ()
  ]
};
