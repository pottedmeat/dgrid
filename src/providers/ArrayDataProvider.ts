import DataProviderBase, { Options, DataProviderState } from '../bases/DataProviderBase';
import { ItemProperties, DataProperties } from '../interfaces';

export interface ArrayDataProviderOptions<T> extends Options {
	idProperty?: string;
	data: T[];
}

function expand(items: any[], idProperty: string, index = 0, array = <ItemProperties<any>[]> []) {
	for (const item of items) {
		const id = String(item[idProperty]);
		array.push({
			id,
			index: index++,
			data: item
		});
	}
	return array;
}

class ArrayDataProvider<T> extends DataProviderBase<T, ArrayDataProviderOptions<T>> {
	buildData(state: DataProviderState<ArrayDataProviderOptions<T>>): DataProperties<T> {
		const {
			options: {
				idProperty = 'id',
				data = []
			},
			slice,
			sort = []
		} = state;
		let items = data;
		if (sort.length) {
			items = items.sort((a: any, b: any) => {
				for (let field of sort) {
					const aValue = a[field.columnId];
					const bValue = b[field.columnId];
					const descending = field.descending;
					if (aValue !== bValue) {
						if (descending) {
							return (aValue > bValue ? -1 : 1);
						}
						else {
							return (aValue < bValue ? -1 : 1);
						}
					}
				}
				return 0;
			});
		}
		const built: DataProperties<T> = {
			sort,
			items: expand(items, idProperty),
			totalLength: data.length
		};
		if (slice) {
			built.items = built.items.slice(slice.start, slice.start + slice.count);
			built.offset = slice.start;
		}
		return built;
	}
}

export default ArrayDataProvider;
