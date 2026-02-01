import js from "@eslint/js";
import globals from "globals";

export default [
	{
		ignores: [".agent/**", "dist/**", "web-ext-artifacts/**"]
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.webextensions,
			},
		},
		rules: {
			"no-unused-vars": ["warn", {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_"
			}],
			"no-undef": "warn",
		},
	},
];
