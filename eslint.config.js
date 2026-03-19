export default [
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                Image: 'readonly',
                setTimeout: 'readonly',
                requestAnimationFrame: 'readonly',
                performance: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'semi': ['warn', 'always'],
            'quotes': ['warn', 'single', { 'avoidEscape': true }],
            'indent': ['warn', 4],
            'no-console': 'off'
        }
    }
];
