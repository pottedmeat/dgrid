import { DNode } from '@dojo/widget-core/interfaces';

export interface Column<T> {
	field?: keyof T;
	id: string;
	label?: string;
	sortable?: boolean; // default true
	get?(item: ItemProperties<T>, column: Column<T>): any;
	render?(item: ItemProperties<T>, column: Column<T>): DNode;
	renderValue?(value: any, item: ItemProperties<T>, column: Column<T>): DNode;
}

export interface DataProperties<T> {
	items: ItemProperties<T>[];
	sort?: SortDetails[];
}

export interface HasColumn {
	column: Column<any>;
}

export interface HasColumns {
	columns: Column<any>[];
}

export interface HasContent {
	content: DNode;
}

export interface HasSliceEvent {
	onSliceRequest(sliceDetails: SliceDetails): void;
}

export interface HasSortDetail {
	sortDetail?: SortDetails;
}

export interface HasSortDetails {
	sortDetails: SortDetails[];
}

export interface HasSortEvent {
	onSortRequest(sortDetail: SortDetails): void;
}

export interface HasItem {
	item: ItemProperties<any>;
}

export interface HasItems {
	items: ItemProperties<any>[];
}

export interface HasValue {
	value: string;
}

export interface ItemProperties<T> {
	id: string;
	data: T;
}

export interface RenderedColumn<T> extends Column<T> {
	render(item: ItemProperties<T>, column: Column<T>): DNode;
}

export interface RenderedValueColumn<T, U> extends Column<T> {
	get?(item: ItemProperties<T>, column: Column<T>): U;
	renderValue(value: U, item: ItemProperties<T>, column: Column<T>): DNode;
}

export interface SliceDetails {
	start: number;
	count: number;
}

export interface SortDetails {
	columnId: string;
	descending?: boolean;
}
