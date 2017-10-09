const fs = require('fs')

module.exports = {
  inputFiles: [
    '*.bundle.css',
    '*.bundle.js',
    '*.ejs.html'
  ],
  excludeFiles: [
    'service-worker.bundle.js'
  ],
  inlinedFiles: [
    'index.bundle.css'
  ],
  outputFiles: file => file.replace('.ejs', ''),
  json: false,
  ejsOptions: {
    rmWhitespace: true
  },
  sha: 256,
  customNewFileName: (filePath, fileString, md5String, baseName, extensionName) => baseName + '-' + md5String + extensionName,
  fileSize: 'file-size.json',
  context: {
    prerender: fs.readFileSync('prerender/index.html')
  }
}
