import { Subscription } from '@dojo/shim/Observable';
import { w } from '@dojo/widget-core/d';
import WidgetBase, { diffProperty } from '@dojo/widget-core/WidgetBase';
import { DNode, PropertyChangeRecord, WidgetBaseConstructor, WidgetBaseInterface, WidgetProperties } from '@dojo/widget-core/interfaces';
import DataProviderBase, { DataProviderState } from './bases/DataProviderBase';
import { SlicePageDetails, Constructor } from './interfaces';
import { PaginationProperties } from './Pagination';

export interface GridPaginationDataProviderState extends DataProviderState {
	page: number;
	itemsPerPage: number;
}

export interface GridPaginationDataProvider<T> extends DataProviderBase<T> {
	slicePage(slice: SlicePageDetails): void;
}

export interface HasGridPaginationPage {
	page?: number;
	onPageSet(): void;
}

export interface GridPaginationProperties extends WidgetProperties, Partial<HasGridPaginationPage> {
	dataProvider: GridPaginationDataProvider<object>;
	itemsPerPage: number;
	paginationConstructor: WidgetBaseConstructor<PaginationProperties> | string;
}

export class GridPagination extends WidgetBase<GridPaginationProperties> {
	private _data?: GridPaginationDataProvider<any>['data'];
	private _subscription: Subscription;

	@diffProperty('page')
	onDiffPropertyPage(previousPage: number, newPage: number): PropertyChangeRecord {
		if (newPage !== undefined) {
			this.onPageRequest(newPage);
		}

		return {
			changed: (previousPage !== undefined),
			value: undefined
		};
	}

	@diffProperty('dataProvider')
	protected diffPropertyDataProvider(previousDataProvider: GridPaginationDataProvider<object>, dataProvider: GridPaginationDataProvider<object>): PropertyChangeRecord {
		const changed = (previousDataProvider !== dataProvider);
		if (changed) {
			this._subscription && this._subscription.unsubscribe();
			this._subscription = dataProvider.observe().subscribe((data) => {
				this._data = (data || {});
				// TODO: Remove setTimeout when invalidation loop is adjusted (https://github.com/dojo/widget-core/pull/494/files)
				setTimeout(this.invalidate.bind(this));
			});
		}

		return {
			changed,
			value: dataProvider
		};
	}

	private onPageRequest(page: number) {
		const {
			dataProvider,
			itemsPerPage,
			onPageSet
		} = this.properties;

		dataProvider.slicePage({
			page,
			itemsPerPage
		});
		onPageSet && onPageSet();
	}

	render(): DNode {
		const {
			_data: data,
			properties: {
				itemsPerPage
			}
		} = this;
		if (!data) {
			this.onPageRequest(1);
		}
		else if (data.size) {
			const items = data.items;
			const {
				limit: {
					start
				},
				size: {
					totalLength = items.length
				} = {}
			} = data;

			const page = Math.floor(start / itemsPerPage) + 1;
			const pages = Math.ceil(totalLength / itemsPerPage);
			const status = `${start + 1} - ${Math.min(start + itemsPerPage, page * itemsPerPage)} of ${totalLength} results`;
			return w<WidgetBaseInterface<PaginationProperties, DNode>>(this.properties.paginationConstructor, {
				page,
				pages,
				status,
				onPageRequest: this.onPageRequest
			});
		}

		return null;
	}
}

export function PaginationDataProviderMixin<T extends Constructor<DataProviderBase<any>>>(Base: T) {
	return class extends Base {
		slicePage(slice: SlicePageDetails): void {
			const state = <GridPaginationDataProviderState> this.state;
			state.page = slice.page;
			state.itemsPerPage = slice.itemsPerPage;
			delete state.slice;
			this.limit({
				start: (state.page - 1) * state.itemsPerPage,
				count: state.itemsPerPage
			});
		}
	};
}
