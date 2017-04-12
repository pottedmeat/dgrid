import { WidgetProperties, WidgetBaseConstructor } from '@dojo/widget-core/interfaces';
import { RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { ScrollTo } from './Grid';

export interface SliceDetails {
	start: number;
	count: number;
}

export interface SortDetails {
	columnId: string;
	descending?: boolean;
}

export interface ItemProperties<T> {
	id: string;
	index: number;
	data: T;
}

export interface DataProperties<T> {
	items: ItemProperties<T>[];
	sort?: SortDetails[];
	offset?: number;
	totalLength?: number;
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

export interface HasEstimatedRowHeight {
	estimatedRowHeight: number; // default 20
}

export interface HasScrollTo {
	scrollTo?: ScrollTo;
	onScrollToComplete(): void;
}

export interface HasSortDetails {
	sortDetails: SortDetails[];
}

export interface HasSortDetail {
	sortDetail?: SortDetails;
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

export interface HasOffset {
	offset: number;
}

export interface HasTotalLength {
	totalLength: number;
}

export interface HasSliceEvent {
	onSliceRequest(sliceDetails: SliceDetails): void;
}
