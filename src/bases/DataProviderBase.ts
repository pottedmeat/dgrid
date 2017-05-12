import { Observable, Observer } from '@dojo/core/Observable';
import { SortDetails, DataProperties, SliceDetails, ItemProperties, Constructor } from '../interfaces';

export interface DataProviderOptions {
}

export interface DataProviderConfiguration {
	slice?: SliceDetails;
	sort?: SortDetails | SortDetails[];
}

export interface DataProviderState {
	slice?: SliceDetails;
	sort?: SortDetails[];
}

abstract class DataProviderBase<T, O extends DataProviderOptions = DataProviderOptions, C extends DataProviderConfiguration = DataProviderConfiguration, S extends DataProviderState = DataProviderState, D extends DataProperties<T> = DataProperties<T>, I extends ItemProperties<T> = ItemProperties<T>> {
	private _observable: Observable<D>;
	private _observers: Observer<D>[] = [];

	protected data: D;
	protected options: O;
	protected state: S = <S> {};

	constructor(options: O, configuration?: C) {
		this.options = options;
		if (configuration) {
			this.configure(configuration, false);
		}

		this._observable = new Observable((observer: Observer<D>) => {
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

	observe(): Observable<D> {
		return this._observable;
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

	protected processData(): void {}

	protected updateData(): void {
		this.buildData();
		this.processData();
		const data = this.data;
		this._observers.forEach((observer) => {
			observer.next(data);
		});
	}
}

export default DataProviderBase;
