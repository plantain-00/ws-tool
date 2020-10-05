import { Configuration } from 'file2variable-cli'

const config: Configuration = {
  files: [
    'app.template.html'
  ],
  handler: () => {
    return {
      type: 'vue3',
    }
  },
  out: 'variables.ts'
}

export default config
