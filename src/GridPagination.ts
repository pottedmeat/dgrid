import { Observable } from '@dojo/core/Observable';
import { includes } from '@dojo/shim/array';
import { Subscription } from '@dojo/shim/Observable';
import { w } from '@dojo/widget-core/d';
import WidgetBase, { diffProperty, onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import { DNode, PropertyChangeRecord, PropertiesChangeEvent, WidgetBaseConstructor, WidgetProperties } from '@dojo/widget-core/interfaces';
import DataProviderBase, { Options } from './bases/DataProviderBase';
import { DataProperties, SizeDetails, SlicePageDetails } from './interfaces';

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

export interface GridPaginationDataProvider extends DataProviderBase<any, Options> {
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

class GridPagination extends WidgetBase<GridPaginationProperties> {
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
