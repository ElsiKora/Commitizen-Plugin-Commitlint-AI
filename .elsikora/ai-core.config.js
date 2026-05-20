export default {
	modules: {
		"commitlint-plugin-commitlint-ai": {
			model: "openai/gpt-5.5",
			provider: "vercel-ai-gateway",
			retries: 3,
			shouldRepromptCredentialOnAuthenticationFailure: true,
			validationRetries: 3,
		},
	},
};
