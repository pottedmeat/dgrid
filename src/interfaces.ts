export interface Column<T> {
	id: string;
	label?: string;
	field?: keyof T;
	sortable?: boolean; // default true
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

export interface HasItem {
	item: ItemProperties<any>;
}

export interface HasItems {
	items: ItemProperties<any>[];
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
