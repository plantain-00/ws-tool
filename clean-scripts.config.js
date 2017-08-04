module.exports = {
  build: [
    `cleancss ./node_modules/bootstrap/dist/css/bootstrap.min.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css -o vendor.bundle.css`,
    `cleancss index.css -o index.bundle.css`,
    `file2variable-cli app.template.html -o variables.ts --html-minify`,
    `tsc`,
    `webpack --display-modules`,
    `rimraf vendor.bundle-*.js vendor.bundle-*.css index.bundle-*.js index.bundle-*.css`,
    `rev-static`,
    `sw-precache --config sw-precache.config.js`,
    `uglifyjs service-worker.js -o service-worker.bundle.js`
  ],
  lint: [
    `tslint "*.ts" "tests/*.ts"`,
    `standard "**/*.config.js"`
  ],
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js'
  ],
  fix: [
    `standard --fix "**/*.config.js"`
  ],
  release: [
    `clean-release`
  ]
}
