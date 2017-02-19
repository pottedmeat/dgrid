import WidgetBase from '@dojo/widget-core/WidgetBase';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { v, w } from '@dojo/widget-core/d';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import Header from './Header';
import HeaderCell from './HeaderCell';
import Body from './Body';
import Row from './Row';
import Cell from './Cell';
import { DataProperties, HasColumns } from './interfaces';
import DataProviderBase, { Options } from './bases/DataProviderBase';
import { HeaderProperties } from './Header';
import { BodyProperties } from './Body';

import * as baseClasses from './styles/grid.css';
import { theme, ThemeableMixin } from '@dojo/widget-core/mixins/Themeable';

/**
 * @type GridProperties
 *
 * Properties that can be set on a Grid
 *
 * @property dataProvider	An observable object that responds to events and returns DataProperties
 * @property columns		Column definitions
 */
export interface GridProperties extends WidgetProperties, HasColumns {
	dataProvider: DataProviderBase<any, Options>;
}

@theme(baseClasses)
class Grid extends ThemeableMixin(WidgetBase)<GridProperties> {
	data: DataProperties<any>;

	constructor() {
		super();
		const { dataProvider } = this.properties;

		const registry = this.registry = new FactoryRegistry();
		registry.define('header', Header);
		registry.define('header-cell', HeaderCell);
		registry.define('body', Body);
		registry.define('row', Row);
		registry.define('cell', Cell);

		if (dataProvider) {
			dataProvider.observe().subscribe((data) => {
				this.data = data;
				this.invalidate();
			});
		}
	}

	render() {
		const {
			registry,
			data: {
				items = [],
				sort = []
			} = {},
			properties: {
				columns,
				dataProvider
			}
		} = this;
		const {
			sort: onSortRequest
		} = dataProvider;

		return v('div.dgrid.dgrid-grid', {
			classes: this.classes(baseClasses.grid).get(),
			role: 'grid'
		}, [
			w('header', <HeaderProperties> {
				registry,
				columns,
				sortDetails: sort,
				onSortRequest: onSortRequest && onSortRequest.bind(dataProvider)
			}),
			w('body', <BodyProperties> {
				registry,
				columns,
				items
			})
		]);
	}
}

export default Grid;
