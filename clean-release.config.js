module.exports = {
  include: [
    '*.bundle-*.js',
    '*.bundle-*.css',
    'service-worker.bundle.js',
    'index.html',
    'proxy.js',
    'types.js',
    'LICENSE',
    'package.json',
    'yarn.lock',
    'README.md'
  ],
  exclude: [
  ],
  askVersion: true,
  releaseRepository: 'https://github.com/plantain-00/ws-tool-release.git',
  postScript: [
    'cd "[dir]" && rm -rf .git',
    'cp Dockerfile "[dir]"',
    'cd "[dir]" && docker build -t plantain/ws-tool . && docker push plantain/ws-tool'
  ]
}
