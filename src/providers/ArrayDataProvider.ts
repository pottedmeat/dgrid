import DataProviderBase, { Options, DataProviderState } from '../bases/DataProviderBase';
import { ItemProperties, DataProperties } from '../interfaces';

export interface ArrayDataProviderOptions<T> extends Options {
	idProperty?: string;
	data: T[];
}

function expand(items: any[], idProperty: string, array = <ItemProperties<any>[]> []) {
	for (const item of items) {
		const id = item[idProperty];
		array.push({
			id,
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
			range,
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
		if (range) {
			built.items = built.items.slice(range.start, range.start + range.count);
			built.offset = range.start;
		}
		return built;
	}
}

export default ArrayDataProvider;
