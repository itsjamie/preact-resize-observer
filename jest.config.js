module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  collectCoverageFrom: ["src/index.tsx"],
  coverageDirectory: "coverage",
  testEnvironment: "jsdom",
  setupFiles: [
    "./node_modules/mutationobserver-shim/dist/mutationobserver.min.js"
  ],
  globals: {
    Object: Object,
  }
};
