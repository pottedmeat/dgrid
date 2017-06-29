import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';

import { WidgetBaseInterface } from '@dojo/widget-core/interfaces';
import WidgetBase from '@dojo/widget-core/WidgetBase';

import Body from '../../src/Body';
import Cell from '../../src/Cell';
import ColumnHeaderCell from '../../src/ColumnHeaderCell';
import ColumnHeaders, { ColumnHeadersProperties } from '../../src/ColumnHeaders';
import Footer from '../../src/Footer';
import GridRegistry, { GridRegistered, gridRegistry } from '../../src/GridRegistry';
import Header from '../../src/Header';
import Row from '../../src/Row';

registerSuite({
	name: 'GridRegistry',

	'GridRegistry'() {
		assert.equal(gridRegistry.get('body'), Body);
		assert.equal(gridRegistry.get('cell'), Cell);
		assert.equal(gridRegistry.get('column-header-cell'), ColumnHeaderCell);
		assert.equal(gridRegistry.get('column-headers'), ColumnHeaders);
		assert.equal(gridRegistry.get('footer'), Footer);
		assert.equal(gridRegistry.get('header'), Header);
		assert.equal(gridRegistry.get('row'), Row);
	},

	'Additional type'() {
		interface MoreProperties extends ColumnHeadersProperties {
			foo: string;
		}

		class Header2 extends WidgetBase<MoreProperties> {}

		interface MoreRegistered extends GridRegistered {
			header: WidgetBaseInterface<MoreProperties>;
		}

		const gridRegistry2 = new GridRegistry<MoreRegistered>();
		gridRegistry2.define('column-headers', Header2);
		const H2 = gridRegistry2.get('column-headers');
		assert.equal(H2, Header2);
		assert.isUndefined(H2 && H2.prototype.properties && H2.prototype.properties.foo); // testing the interface
	}
});
