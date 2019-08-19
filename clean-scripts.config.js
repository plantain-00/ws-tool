const { Service, executeScriptAsync } = require('clean-scripts')
const { watch } = require('watch-then-execute')

const tsFiles = `"*.ts" "spec/**/*.ts" "screenshots/**/*.ts" "prerender/**/*.ts" "tests/**/*.ts"`
const jsFiles = `"*.config.js" "spec/**/*.config.js"`

const isDev = process.env.NODE_ENV === 'development'

const templateCommand = `file2variable-cli --config file2variable.config.js`
const tscCommand = `tsc`
const webpackCommand = `webpack`
const revStaticCommand = `rev-static`
const cssCommand = [
  `postcss index.css -o index.postcss.css`,
  `cleancss index.postcss.css -o index.bundle.css`
]
const swCommand = isDev ? undefined : [
  `sw-precache --config sw-precache.config.js`,
  `uglifyjs service-worker.js -o service-worker.bundle.js`
]

module.exports = {
  build: [
    {
      js: [
        templateCommand,
        tscCommand,
        webpackCommand
      ],
      css: {
        vendor: isDev ? undefined : `cleancss ./node_modules/bootstrap/dist/css/bootstrap.min.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css -o vendor.bundle.css`,
        index: cssCommand
      },
      clean: `rimraf vendor.bundle-*.js vendor.bundle-*.css index.bundle-*.js index.bundle-*.css`
    },
    revStaticCommand,
    swCommand
  ],
  lint: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p . --strict'
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js'
  ],
  fix: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles} --fix`,
  watch: {
    template: `${templateCommand} --watch`,
    webpack: `${webpackCommand} --watch`,
    css: () => watch(['index.css'], [], () => executeScriptAsync(cssCommand)),
    rev: `${revStaticCommand} --watch`
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
    revStaticCommand,
    swCommand
  ]
}
