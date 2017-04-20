import { Observable } from '@dojo/core/Observable';
import { includes } from '@dojo/shim/array';
import { Subscription } from '@dojo/shim/Observable';
import { w } from '@dojo/widget-core/d';
import WidgetBase, { diffProperty, onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import { DNode, PropertyChangeRecord, PropertiesChangeEvent, WidgetBaseConstructor, WidgetProperties } from '@dojo/widget-core/interfaces';
import DataProviderBase, { Options, DataProviderState } from './bases/DataProviderBase';
import { DataProperties, SizeDetails, SlicePageDetails, Constructor, SliceDetails } from './interfaces';

export interface PaginationProperties {
	page: number;
	pages: number;
	onPageRequest(page: number): void;
}

export interface GridPaginationSizeDetails extends SizeDetails {
	min: number;
	max: number;
}

export interface GridPaginationDataProperties extends DataProperties<any> {
	size: GridPaginationSizeDetails;
}

export interface GridPaginationDataProviderState extends DataProviderState<Options> {
	page: number;
	itemsPerPage: number;
}

export interface GridPaginationDataProvider extends DataProviderBase<GridPaginationDataProperties, Options, GridPaginationDataProviderState> {
	slicePage(slice: SlicePageDetails): void;
	observe(): Observable<GridPaginationDataProperties>;
}

export interface HasGridPaginationPage {
	page?: number;
	onPageSet(): void;
}

export interface GridPaginationProperties extends WidgetProperties, Partial<HasGridPaginationPage> {
	dataProvider: GridPaginationDataProvider;
	itemsPerPage: number;
	paginationConstructor: WidgetBaseConstructor<PaginationProperties> | string;
}

export class GridPagination extends WidgetBase<GridPaginationProperties> {
	private page = 1;
	private pages = 1;
	private subscription: Subscription;

	@diffProperty('page')
	onDiffPropertyPage(previousPage: number, newPage: number): PropertyChangeRecord {
		if (newPage !== undefined) {
			this.onPageRequest(newPage);
		}

		return {
			changed: false,
			value: undefined
		};
	}

	@onPropertiesChanged()
	protected onPropertiesChanged(evt: PropertiesChangeEvent<this, GridPaginationProperties>) {
		const {
			dataProvider
		} = evt.properties;

		if (includes(evt.changedPropertyKeys, 'dataProvider')) {
			if (this.subscription) {
				this.subscription.unsubscribe();
			}

			this.subscription = dataProvider.observe().subscribe((data) => {
				const {
					size: {
						min,
						totalLength
					}
				} = data;
				const itemsPerPage = this.properties.itemsPerPage;

				this.page = Math.floor(min / itemsPerPage) + 1;
				this.pages = Math.ceil(totalLength / itemsPerPage);
				this.invalidate();
			});
		}
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
		return w<PaginationProperties>(this.properties.paginationConstructor, {
			page: this.page,
			pages: this.pages,
			onPageRequest: this.onPageRequest
		});
	}
}

export function PaginationDataProviderMixin<P extends DataProperties<any>, O extends Options, S extends DataProviderState<O>, T extends Constructor<DataProviderBase<P, O, S>>>(Base: T): Constructor<DataProviderBase<P, O, S>> {
	class PaginationDataProvider extends Base {
		slicePage(slice: SlicePageDetails): void {
			const state: S & GridPaginationDataProviderState = <any> this.__state__();
			state.page = slice.page;
			state.itemsPerPage = slice.itemsPerPage;
			this.slice({
				start: (state.page - 1) * state.itemsPerPage,
				count: state.itemsPerPage
			});
		}

		protected processData(data: P): P & GridPaginationDataProperties {
			const state: S & GridPaginationDataProviderState = <any> this.__state__();
			if (state.page && state.itemsPerPage) {
				const itemsLength = data.items.length;
				if (!data.size) {
					data.size = {
						start: 0,
						totalLength: itemsLength,
						min: 0,
						max: (itemsLength - 1)
					};
				}
				else {
					const start = data.size.start;
					data.size.min = start;
					data.size.max = (start + itemsLength - 1);
				}
			}
			return <any> data;
		}
	};
	return PaginationDataProvider;
}
