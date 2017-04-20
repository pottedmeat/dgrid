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

/**
 * T: Data type
 * O: Options passed to the constructor
 */
class DataProviderBase<P extends DataProperties<any>, O extends Options, S extends DataProviderState<O>> {
	private data: P;
	private state: S;

	observable: Observable<P>;
	observers: Observer<P>[];

	constructor(options: O) {
		const {
			configuration: {
				slice = undefined,
				sort = []
			} = {}
		} = options;
		this.state = <S> {
			options: options || {},
			slice,
			sort: Array.isArray(sort) ? sort : [ sort ]
		};
		this.observable = new Observable((observer: Observer<P>) => {
			this.observers.push(observer);
			if (this.data) {
				observer.next(this.data);
			}
		});
		this.observers = [];
	}

	protected __state__(): S {
		return this.state;
	}

	buildData(state: S): P {
		return <any> { items: [] };
	}

	configure({ slice, sort = [] }: Configuration) {
		this.state.slice = slice;
		this.state.sort = Array.isArray(sort) ? sort : [ sort ];
		this.updateData();
	}

	observe(): Observable<P> {
		return this.observable;
	}

	protected processData(data: P): P {
		return data;
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

	protected updateData(): void {
		const data = this.data = this.processData(this.buildData(this.state));
		this.observers.forEach((observer) => {
			observer.next(data);
		});
	}
}

export default DataProviderBase;
