import Promise from '@dojo/shim/Promise';
import { Constructor, WidgetBaseInterface, WidgetProperties } from '@dojo/widget-core/interfaces';
import WidgetRegistry, { WidgetRegistryItem } from '@dojo/widget-core/WidgetRegistry';
import Body, { BodyProperties } from './Body';
import Cell, { CellProperties } from './Cell';
import ColumnHeaderCell, { ColumnHeaderCellProperties } from './ColumnHeaderCell';
import ColumnHeaders, { ColumnHeadersProperties } from './ColumnHeaders';
import Footer, { FooterProperties } from './Footer';
import Header, { HeaderProperties } from './Header';
import PageLink, { PageLinkProperties } from './pagination/PageLink';
import Pagination, { PaginationProperties } from './Pagination';
import Row, { RowProperties } from './Row';

export interface GridRegistered {
	[key: string]: WidgetBaseInterface;
	body: WidgetBaseInterface<BodyProperties>;
	cell: WidgetBaseInterface<CellProperties>;
	'column-header-cell': WidgetBaseInterface<ColumnHeaderCellProperties>;
	'column-headers': WidgetBaseInterface<ColumnHeadersProperties>;
	footer: WidgetBaseInterface<FooterProperties>;
	header: WidgetBaseInterface<HeaderProperties>;
	'page-link': WidgetBaseInterface<PageLinkProperties>;
	pagination: WidgetBaseInterface<PaginationProperties>;
	row: WidgetBaseInterface<RowProperties>;
}

export default class GridRegistry<T extends GridRegistered = GridRegistered> extends WidgetRegistry {
	private _overrides: WidgetRegistry = new WidgetRegistry();

	constructor() {
		super();

		super.define('body', Body);
		super.define('cell', Cell);
		super.define('column-header-cell', ColumnHeaderCell);
		super.define('column-headers', ColumnHeaders);
		super.define('footer', Footer);
		super.define('header', Header);
		super.define('page-link', PageLink);
		super.define('pagination', Pagination);
		super.define('row', Row);
	}

	// define<K extends keyof T>(widgetLabel: K, registryItem: Constructor<T[K]> | Promise<Constructor<T[K]>> | (() => Promise<Constructor<T[K]>>)): void {
	define<K extends keyof T>(widgetLabel: K, registryItem: WidgetRegistryItem): void {
		this._overrides.define(widgetLabel, registryItem);
	}

	// get<K extends keyof T>(widgetLabel: K): Constructor<T[K]> | null {
	get<K extends keyof T, B extends WidgetBaseInterface = WidgetBaseInterface>(widgetLabel: K): Constructor<B> | null {
		return this._overrides.get(widgetLabel) || super.get(widgetLabel);
	}

	has<K extends keyof T>(widgetLabel: K): boolean {
		return this._overrides.has(widgetLabel) || super.has(widgetLabel);
	}
}

export const gridRegistry = new GridRegistry();
