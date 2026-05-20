import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";

import { describe, expect, it, vi } from "vitest";

import { AiCoreCliInterfaceService } from "@infrastructure/service/ai-core-cli-interface.service";

function createCliInterface(): ICliInterfaceService {
	return {
		clear: vi.fn(),
		confirm: vi.fn(),
		error: vi.fn(),
		groupMultiselect: vi.fn(),
		handleError: vi.fn(),
		info: vi.fn(),
		log: vi.fn(),
		multiselect: vi.fn(),
		note: vi.fn(),
		password: vi.fn().mockResolvedValue("secret-value"),
		select: vi.fn(),
		startSpinner: vi.fn(),
		stopSpinner: vi.fn(),
		success: vi.fn(),
		text: vi.fn(),
		updateSpinner: vi.fn(),
		warn: vi.fn(),
	};
}

describe("AiCoreCliInterfaceService", () => {
	it("delegates password prompts to masked local CLI prompts", async () => {
		const cliInterface = createCliInterface();
		const service = new AiCoreCliInterfaceService(cliInterface);
		const validate = vi.fn();

		await expect(service.password("API key:", "default", validate)).resolves.toBe("secret-value");

		expect(cliInterface.password).toHaveBeenCalledWith("API key:", "default", validate);
		expect(cliInterface.text).not.toHaveBeenCalled();
	});

	it("maps AI-Core select options through the local CLI contract", async () => {
		const cliInterface = createCliInterface();
		vi.mocked(cliInterface.select).mockResolvedValue("1");
		const service = new AiCoreCliInterfaceService(cliInterface);

		await expect(
			service.select("Provider:", [
				{ label: "OpenAI", value: "openai" },
				{ label: "Anthropic", value: "anthropic" },
			]),
		).resolves.toBe("anthropic");
	});
});
