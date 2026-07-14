module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'config',
      'domain',
      'application',
      'infrastructure',
      'graphql',
      'database',
      'blog',
      'admin',
      'auth',
      'testing',
      'ci',
      'docker',
      'logging',
      'deps',
    ]],
  },
};
