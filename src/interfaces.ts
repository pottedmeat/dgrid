import { WidgetProperties, WidgetBaseConstructor } from '@dojo/widget-core/interfaces';
import { RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';

export interface SortDetails {
	columnId: string;
	descending?: boolean;
}

export interface ItemProperties<T> {
	id: string;
	data: T;
}

export interface DataProperties<T> {
	items: ItemProperties<T>[];
	sort?: SortDetails[];
}

export interface CellRendererProperties extends WidgetProperties, HasValue, HasColumn, HasItem, RegistryMixinProperties { }

export interface HasCellRenderer<T> {
	cellRenderer?(item: ItemProperties<T>): string | WidgetBaseConstructor<CellRendererProperties>;
}

export interface Column<T> extends HasCellRenderer<T> {
	id: string;
	label?: string;
	field?: string;
	sortable?: boolean; // default true
}

export interface HasColumns {
	columns: Column<any>[];
}

export interface HasColumn {
	column: Column<any>;
}

export interface HasSortDetails {
	sortDetails: SortDetails[];
}

export interface HasSortDetail {
	sortDetail: SortDetails;
}

export interface HasSortEvent {
	onSortRequest(sortDetail: SortDetails): void;
}

export interface HasItems {
	items: ItemProperties<any>[];
}

export interface HasItem {
	item: ItemProperties<any>;
}

export interface HasValue {
	value: string;
}
