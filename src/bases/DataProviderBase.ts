import { Observable, Observer } from '@dojo/core/Observable';
import { SortDetails, DataProperties, SliceDetails } from '../interfaces';

export interface DataProviderConfiguration {
	slice?: SliceDetails;
	sort?: SortDetails | SortDetails[];
}

export interface Options {
	[option: string]: any;
	configuration?: DataProviderConfiguration;
}

export interface DataProviderState<O extends Options> {
	options: O;
	slice?: SliceDetails;
	sort?: SortDetails[];
}

/**
 * T: Data type
 * O: Options passed to the constructor
 */
class DataProviderBase<P extends DataProperties<any>, O extends Options, S extends DataProviderState<O>> {
	private _data: P;
	private _state: S;
	private _observable: Observable<P>;
	private _observers: Observer<P>[];

	constructor(options: O) {
		const {
			configuration: {
				slice = undefined,
				sort = []
			} = {}
		} = options;
		this._state = <S> {
			options: options || {},
			slice,
			sort: Array.isArray(sort) ? sort : [ sort ]
		};
		this._observable = new Observable((observer: Observer<P>) => {
			this._observers.push(observer);
			if (this._data) {
				observer.next(this._data);
			}
		});
		this._observers = [];
	}

	protected __state__(): S {
		return this._state;
	}

	buildData(state: S): P {
		return <any> { items: [] };
	}

	configure({ slice, sort = [] }: DataProviderConfiguration) {
		this._state.slice = slice;
		this._state.sort = Array.isArray(sort) ? sort : [ sort ];
		this.updateData();
	}

	observe(): Observable<P> {
		return this._observable;
	}

	protected processData(data: P): P {
		return data;
	}

	slice(slice: SliceDetails) {
		this._state.slice = slice;
		this.updateData();
	}

	sort(sort: SortDetails | SortDetails[]) {
		this._state.sort = (Array.isArray(sort) ? sort : [ sort ]).map((sortDetail) => {
			sortDetail.descending = Boolean(sortDetail.descending);
			return sortDetail;
		});
		this.updateData();
	}

	protected updateData(): void {
		const data = this._data = this.processData(this.buildData(this._state));
		this._observers.forEach((observer) => {
			observer.next(data);
		});
	}
}

export default DataProviderBase;
