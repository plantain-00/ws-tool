export default {
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
  outputFiles: (file: string) => file.replace('.ejs', ''),
  json: false,
  ejsOptions: {
    rmWhitespace: true
  },
  sha: 256,
  customNewFileName: (_filePath: string, _fileString: string, md5String: string, baseName: string, extensionName: string) => baseName + '-' + md5String + extensionName,
  fileSize: 'file-size.json',
  context: {
    buildMoment: new Date().toString()
  }
}
