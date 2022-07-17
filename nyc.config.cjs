module.exports = {
  "all": true,
  "extension": [
    ".ts"
  ],
  "require": [
    "ts-node/register"
  ],
  "cache": false,
  "include": [
    "dist/*",
    "src/*"
  ],
  "exclude": [
    "dist/**/*.d.ts",
    "**/__test__/*.[jt]s",
  ],
  "reporter": [
    "text",
    "json"
  ]
}