import { Observable, Observer } from '@dojo/core/Observable';
import { SortDetails, DataProperties, SliceDetails } from '../interfaces';

export interface Configuration {
	slice?: SliceDetails;
	sort?: SortDetails | SortDetails[];
}

export interface Options {
	[option: string]: any;
	configuration?: Configuration;
}

export interface DataProviderState<O extends Options> {
	options: O;
	slice?: SliceDetails;
	sort?: SortDetails[];
}

class DataProviderBase<T, O extends Options> {
	private data: DataProperties<T>;
	private state: DataProviderState<O>;

	observable: Observable<DataProperties<T>>;
	observers: Observer<DataProperties<T>>[];

	constructor(options: O) {
		const {
			configuration: {
				slice = undefined,
				sort = []
			} = {}
		} = options;
		this.state = {
			options: options || {},
			slice,
			sort: Array.isArray(sort) ? sort : [ sort ]
		};
		this.observable = new Observable((observer: Observer<DataProperties<T>>) => {
			this.observers.push(observer);
			if (this.data) {
				observer.next(this.data);
			}
		});
		this.observers = [];

		this.updateData();
	}

	buildData(state: DataProviderState<O>): DataProperties<T> {
		return { items: [] };
	}

	configure({ slice, sort = [] }: Configuration) {
		this.state.slice = slice;
		this.state.sort = Array.isArray(sort) ? sort : [ sort ];
		this.updateData();
	}

	observe() {
		return this.observable;
	}

	slice(slice: SliceDetails) {
		this.state.slice = slice;
		this.updateData();
	}

	sort(sort: SortDetails | SortDetails[]) {
		this.state.sort = (Array.isArray(sort) ? sort : [ sort ]).map((sortDetail) => {
			sortDetail.descending = Boolean(sortDetail.descending);
			return sortDetail;
		});
		this.updateData();
	}

	updateData() {
		const data = this.data = this.buildData(this.state);
		this.observers.forEach((observer) => {
			observer.next(data);
		});
	}
}

export default DataProviderBase;
