import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/build',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:web',
              onlyDependOnLibsWithTags: [
                'type:web',
                'type:contracts',
                'type:ui',
                'type:configuration',
                'type:testing',
              ],
            },
            {
              sourceTag: 'type:api',
              onlyDependOnLibsWithTags: [
                'type:api',
                'type:contracts',
                'type:database',
                'type:configuration',
                'type:testing',
              ],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:contracts'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:contracts', 'type:configuration'],
            },
            {
              sourceTag: 'type:database',
              onlyDependOnLibsWithTags: ['type:database', 'type:contracts', 'type:configuration'],
            },
            {
              sourceTag: 'type:configuration',
              onlyDependOnLibsWithTags: ['type:configuration', 'type:contracts'],
            },
            {
              sourceTag: 'type:testing',
              onlyDependOnLibsWithTags: ['type:testing', 'type:contracts'],
            },
            {
              sourceTag: 'scope:identity',
              onlyDependOnLibsWithTags: ['scope:identity', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:platform',
              onlyDependOnLibsWithTags: ['scope:platform', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:community',
              onlyDependOnLibsWithTags: ['scope:community', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:residency',
              onlyDependOnLibsWithTags: ['scope:residency', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:finance',
              onlyDependOnLibsWithTags: ['scope:finance', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:publication',
              onlyDependOnLibsWithTags: ['scope:publication', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:audit',
              onlyDependOnLibsWithTags: ['scope:audit', 'scope:shared', 'scope:contracts'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
