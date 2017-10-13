const childProcess = require('child_process')
const util = require('util')
const { Service } = require('clean-scripts')

const execAsync = util.promisify(childProcess.exec)

const tsFiles = `"*.ts" "spec/**/*.ts" "screenshots/**/*.ts" "prerender/**/*.ts"`
const jsFiles = `"*.config.js" "spec/**/*.config.js"`

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
        index: [
          `postcss index.css -o index.postcss.css`,
          `cleancss index.postcss.css -o index.bundle.css`
        ]
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
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    async () => {
      const { stdout } = await execAsync('git status -s')
      if (stdout) {
        console.log(stdout)
        throw new Error(`generated files doesn't match.`)
      }
    }
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`
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
  screenshot: [
    new Service(`http-server -p 8000`),
    `tsc -p screenshots`,
    `node screenshots/index.js`
  ],
  prerender: [
    new Service(`http-server -p 8000`),
    `tsc -p prerender`,
    `node prerender/index.js`,
    `clean-scripts build[1]`,
    `clean-scripts build[2]`
  ]
}
