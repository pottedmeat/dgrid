import { Observable, Observer } from '@dojo/core/Observable';
import { SortDetails, DataProperties, SliceDetails, ItemProperties, Constructor, LimitDetails } from '../interfaces';

export interface DataProviderOptions {
}

export interface DataProviderConfiguration {
	slice?: SliceDetails;
	sort?: SortDetails | SortDetails[];
}

export interface DataProviderState {
	limit?: LimitDetails;
	slice?: SliceDetails;
	sort?: SortDetails[];
	expanded: { [key: string]: any };
}

abstract class DataProviderBase<T = any, O extends DataProviderOptions = DataProviderOptions, C extends DataProviderConfiguration = DataProviderConfiguration> {
	private _observable: Observable<DataProperties<T>>;
	private _observers: Observer<DataProperties<T>>[] = [];

	protected data: DataProperties<T>;
	protected options: O;
	protected state: DataProviderState = <DataProviderState> {
		expanded: {}
	};

	constructor(options: O, configuration?: C) {
		this.options = options;
		if (configuration) {
			this.configure(configuration, false);
		}

		this._observable = new Observable((observer: Observer<DataProperties<T>>) => {
			this._observers.push(observer);
			if (this.data) {
				observer.next(this.data);
			}
			return () => {
				const index = this._observers.indexOf(observer);
				if (index > -1) {
					this._observers.slice(index, 1);
				}
			};
		});
	}

	/**
	 * Use options and state to update data
	 */
	protected buildData(): void {}

	configure({ slice, sort = [] }: C, updateData = true) {
		this.state.slice = slice;
		if (sort) {
			this.state.sort = Array.isArray(sort) ? sort : [ sort ];
		}
		if (updateData) {
			this.updateData();
		}
	}

	observe(): Observable<DataProperties<T>> {
		return this._observable;
	}

	slice(slice: SliceDetails) {
		this.state.slice = slice;
		this.updateData();
	}

	limit(limit: LimitDetails) {
		this.state.limit = limit;
		this.updateData();
	}

	sort(sort: SortDetails | SortDetails[]) {
		this.state.sort = (Array.isArray(sort) ? sort : [ sort ]).map((sortDetail) => {
			sortDetail.descending = Boolean(sortDetail.descending);
			return sortDetail;
		});
		this.updateData();
	}

	toggleExpanded(item: ItemProperties<object>) {
		const expanded = this.state.expanded;
		expanded[item.id] = !expanded[item.id];
		this.updateData();
	}

	protected updateData(): void {
		this.buildData();
		const data = this.data;
		this._observers.forEach((observer) => {
			observer.next(data);
		});
	}
}

export default DataProviderBase;
