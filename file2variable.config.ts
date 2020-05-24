export default {
  files: [
    'app.template.html'
  ],
  handler: () => {
    return {
      type: 'vue',
      name: 'App',
      path: './index'
    }
  },
  out: 'variables.ts'
}
