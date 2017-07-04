module.exports = {
  inputFiles: [
    '*.bundle.css',
    'index.bundle.js',
    'vendor.bundle.js',
    '*.ejs.html'
  ],
  outputFiles: file => file.replace('.ejs', ''),
  json: false,
  ejsOptions: {
    rmWhitespace: true
  },
  sha: 256,
  customNewFileName: (filePath, fileString, md5String, baseName, extensionName) => baseName + '-' + md5String + extensionName,
  noOutputFiles: [],
  fileSize: 'file-size.json'
}
