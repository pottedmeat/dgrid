import { SortDetail, DataProperties } from '../createGrid';
import { Observable, Observer } from '@dojo/core/Observable';
import compose, { Options } from '@dojo/compose/compose';
import WeakMap from '@dojo/shim/WeakMap';

export interface DgridDataProviderGridState<T extends Options> {
	options: T;
	sorts: SortDetail[];
}

export interface DgridDataProviderState extends DgridDataProviderGridState<Options> {
	data?: DataProperties;
	observers: Observer<DataProperties>[];
	observable: Observable<DataProperties>;
}

export interface DgridDataProvider {
	data(state: DgridDataProviderGridState<Options>): DataProperties;
	sorts: SortDetail[];
	observe(): Observable<DataProperties>;
	onSortRequest(sortDetail: SortDetail): void;
}

const instanceStateMap = new WeakMap<DgridDataProvider, DgridDataProviderState>();

function updateData(dataProvider: DgridDataProvider, observer?: Observable<DataProperties>) {
	const state = instanceStateMap.get(dataProvider);
	const data = state.data = dataProvider.data(state);
	state.observers.forEach((observer) => {
		observer.next(data);
	});
}

const createDataProviderBase = compose<DgridDataProvider, Options>({
	data() {
		return {
			items: [
				{
					id: '1',
					data: {}
				}
			]
		};
	},
	set sorts(this: DgridDataProvider, sorts: SortDetail[]) {
		const state = instanceStateMap.get(this);
		state.sorts = sorts;
		updateData(this);
	},
	get sorts(this: DgridDataProvider) {
		return instanceStateMap.get(this).sorts;
	},
	observe(this: DgridDataProvider) {
		return instanceStateMap.get(this).observable;
	},
	onSortRequest(this: DgridDataProvider, sortDetail: SortDetail) {
		const {
			columnId,
			descending = false
		} = sortDetail;
		this.sorts = [ { columnId, descending }];
	}
}, function(instance, options) {
	const observable = new Observable<DataProperties>(function subscribe(this: DgridDataProvider, observer: Observer<DataProperties>) {
		const state = instanceStateMap.get(this);
		state.observers.push(observer);
		if (state.data) {
			observer.next(state.data);
		}
		return () => {
			function remove(observer: Observer<DataProperties>) {
				state.observers.splice(state.observers.indexOf(observer), 1);
			}
			setTimeout(() => {
				remove(observer);
			});
		};
	}.bind(instance));
	const state: DgridDataProviderState = {
		options: options || {},
		sorts: [],
		observers: [],
		observable: observable
	};
	instanceStateMap.set(instance, state);

	updateData(instance);
});

export default createDataProviderBase;
