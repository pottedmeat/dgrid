import Set from '@dojo/shim/Set';
import DataProviderBase, { DataProviderOptions } from '../bases/DataProviderBase';
import { ItemProperties } from '../interfaces';

export interface ArrayDataProviderOptions<T> extends DataProviderOptions {
	idProperty?: string;
	data: T[];
}

function expand(items: any[], idProperty: string, expanded: { [key: string]: any }, until = Infinity, index = 0, array = <ItemProperties<any>[]> [], parents: Set<string> = new Set<string>(), parent: string = '', depth = 0): ItemProperties<any>[] {
	if (!parents.size) {
		for (const item of items) {
			if (item.parent) {
				parents.add(String(item.parent));
			}
		}
	}

	for (const item of items) {
		if (array.length >= until) {
			return array;
		}

		const id = String(item[idProperty]);
		const isExpanded = expanded[id];
		const canExpand = parents.has(id);
		if (parent) {
			if (parent === String(item.parent)) {
				array.push({
					id,
					expandedLevel: depth,
					isExpanded,
					canExpand,
					index: index++,
					data: item
				});
				if (isExpanded) {
					const length = array.length;
					expand(items, idProperty, expanded, until, index, array, parents, id, depth + 1);
					index += (array.length - length);
				}
			}
		}
		else if (!item.parent) {
			array.push({
				id,
				isExpanded,
				canExpand,
				index: index++,
				data: item
			});
			if (isExpanded) {
				const length = array.length;
				expand(items, idProperty, expanded, until, index, array, parents, id, depth + 1);
				index += (array.length - length);
			}
		}
	}
	return array;
}

class ArrayDataProvider<T> extends DataProviderBase<T, ArrayDataProviderOptions<T>> {
	protected buildData() {
		const {
			options: {
				idProperty = 'id',
				data = []
			},
			state: {
				slice,
				sort,
				expanded
			}
		} = this;

		let items = data;
		if (sort && sort.length) {
			items = [ ...items].sort((a: any, b: any) => {
				for (let field of sort) {
					const aValue = a[field.columnId];
					const bValue = b[field.columnId];
					const ascending = !field.descending;
					if (aValue !== bValue) {
						if (ascending) {
							return (aValue < bValue ? -1 : 1);
						}
						else {
							return (aValue > bValue ? -1 : 1);
						}
					}
				}
				return 0;
			});
		}
		const itemProperties: ArrayDataProvider<T>['data'] = {
			sort,
			items: expand(items, idProperty, expanded, slice ? (slice.start + slice.count) : Infinity),
			size: {
				start: 0,
				totalLength: data.length
			}
		};
		if (slice) {
			itemProperties.items = itemProperties.items.slice(slice.start, slice.start + slice.count);
			itemProperties.size && (itemProperties.size.start = slice.start);
		}
		this.data = itemProperties;
	}
}

export default ArrayDataProvider;
