import { repo } from "@fxmanager/database";

export const isProduction = process.env.NODE_ENV === 'production';

export function isFxManagerSetup() {
	return repo.auth.countUsers() > 0;
}
