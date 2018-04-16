module.exports = {
  files: [
    'app.template.html'
  ],
  /**
   * @argument {string} file
   */
  handler: file => {
    return {
      type: 'vue',
      name: 'App',
      path: './index'
    }
  },
  out: 'variables.ts'
}
