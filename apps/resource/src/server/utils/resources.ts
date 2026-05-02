import type { ResourceData } from '@fxmanager/shared/types';

export function getResourcesData(
	resourceName?: string,
): (ResourceData | null) | ResourceData[] {
	if (resourceName) {
		const state = GetResourceState(resourceName);

		if (state === 'missing' || state === 'unknown') return null;

		return {
			name: resourceName,
			status: state === 'started' ? 'started' : 'stopped',
			author: GetResourceMetadata(resourceName, 'author', 0),
			version: GetResourceMetadata(resourceName, 'version', 0),
			description: GetResourceMetadata(resourceName, 'description', 0),
			repository: GetResourceMetadata(resourceName, 'repository', 0),
			path: GetResourcePath(resourceName),
		};
	} else {
		const resources: ResourceData[] = [];
		const resourceCount = GetNumResources();

		for (let i = 0; i < resourceCount; i++) {
			const name = GetResourceByFindIndex(i);
			const state = GetResourceState(name);

			if (state === 'missing' || state === 'unknown') continue;

			resources.push({
				name,
				status: state === 'started' ? 'started' : 'stopped',
				author: GetResourceMetadata(name, 'author', 0),
				version: GetResourceMetadata(name, 'version', 0),
				description: GetResourceMetadata(name, 'description', 0),
				repository: GetResourceMetadata(name, 'repository', 0),
				path: GetResourcePath(name),
			});
		}

		return resources;
	}
}
