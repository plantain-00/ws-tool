const childProcess = require('child_process')

module.exports = {
  build: [
    {
      js: [
        `file2variable-cli app.template.html -o variables.ts --html-minify`,
        `tsc`,
        `webpack --display-modules`
      ],
      css: {
        vendor: `cleancss ./node_modules/bootstrap/dist/css/bootstrap.min.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css -o vendor.bundle.css`,
        index: `cleancss index.css -o index.bundle.css`
      },
      clean: `rimraf vendor.bundle-*.js vendor.bundle-*.css index.bundle-*.js index.bundle-*.css`
    },
    `rev-static`,
    [
      `sw-precache --config sw-precache.config.js`,
      `uglifyjs service-worker.js -o service-worker.bundle.js`
    ]
  ],
  lint: {
    ts: `tslint "*.ts" "tests/*.ts"`,
    js: `standard "**/*.config.js"`,
    export: `no-unused-export "*.ts" "tests/*.ts"`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    () => new Promise((resolve, reject) => {
      childProcess.exec('git status -s', (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          if (stdout) {
            reject(new Error(`generated files doesn't match.`))
          } else {
            resolve()
          }
        }
      }).stdout.pipe(process.stdout)
    })
  ],
  fix: {
    ts: `tslint --fix "*.ts" "tests/*.ts"`,
    js: `standard --fix "**/*.config.js"`
  },
  release: `clean-release`,
  watch: {
    template: `file2variable-cli app.template.html -o variables.ts --html-minify --watch`,
    src: `tsc --watch`,
    webpack: `webpack --watch`,
    css: `watch-then-execute "index.css" --script "clean-scripts build[0].css.index"`,
    rev: `rev-static --watch`,
    sw: `watch-then-execute "vendor.bundle-*.js" "index.html" "worker.bundle.js" --script "clean-scripts build[2]"`
  },
  prerender: [
    async () => {
      const { createServer } = require('http-server')
      const { prerender } = require('prerender-js')
      const server = createServer()
      server.listen(8000)
      await prerender('http://localhost:8000', '#prerender-container', 'prerender.html')
      server.close()
    },
    `clean-scripts build[1]`,
    `clean-scripts build[2]`
  ]
}
