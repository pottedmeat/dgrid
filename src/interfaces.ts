import { WidgetProperties, WidgetBaseConstructor } from '@dojo/widget-core/interfaces';
import { RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';

export interface CellRendererProperties extends WidgetProperties, HasValue, HasColumn, HasItem, RegistryMixinProperties { }

export interface Column<T> extends HasCellRenderer<T> {
	id: string;
	label?: string;
	field?: keyof T;
	sortable?: boolean; // default true
}

export interface DataProperties<T> {
	items: ItemProperties<T>[];
	sort?: SortDetails[];
}

export interface HasCellRenderer<T> {
	cellRenderer?(item: ItemProperties<T>): string | WidgetBaseConstructor<CellRendererProperties>;
}

export interface HasColumn {
	column: Column<any>;
}

export interface HasColumns {
	columns: Column<any>[];
}

export interface HasItem {
	item: ItemProperties<any>;
}

export interface HasItems {
	items: ItemProperties<any>[];
}

export interface HasSortDetail {
	sortDetail: SortDetails;
}

export interface HasSortDetails {
	sortDetails: SortDetails[];
}

export interface HasSortEvent {
	onSortRequest(sortDetail: SortDetails): void;
}

export interface HasValue {
	value: string;
}

export interface ItemProperties<T> {
	id: string;
	data: T;
}

export interface SortDetails {
	columnId: string;
	descending?: boolean;
}

