import DataProviderBase, { DataProviderOptions } from '../bases/DataProviderBase';
import { ItemProperties } from '../interfaces';

export interface ArrayDataProviderOptions<T> extends DataProviderOptions {
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
	protected buildData() {
		const {
			options: {
				idProperty = 'id',
				data = []
			},
			state: {
				slice,
				sort
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
		const built: ArrayDataProvider<T>['data'] = {
			sort,
			items: expand(items, idProperty),
			size: {
				start: 0,
				totalLength: data.length
			}
		};
		if (slice) {
			built.items = built.items.slice(slice.start, slice.start + slice.count);
			built.size && (built.size.start = slice.start);
		}
		this.data = built;
	}
}

export default ArrayDataProvider;
