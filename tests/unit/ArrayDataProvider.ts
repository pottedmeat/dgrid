import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';
import ArrayDataProvider from '../../src/providers/ArrayDataProvider';
import { DataProperties } from '../../src/interfaces';

registerSuite({
	name: 'ArrayDataProvider',
	'default ascending'() {
		const dataProvider = new ArrayDataProvider({
			data: [
				{ id: 1 },
				{ id: 3 },
				{ id: 5 },
				{ id: 2 },
				{ id: 4 },
				{ id: 1 }
			]
		});
		let data: DataProperties<any> = { items: [] };
		const subscription = dataProvider.observe().subscribe((updated) => {
			data = updated;
		});
		dataProvider.sort({ columnId: 'id' });

		assert.deepEqual(data, {
			sort: [ { columnId: 'id', descending: false } ],
			items: [
				{ id: 1, data: { id: 1 } },
				{ id: 1, data: { id: 1 } },
				{ id: 2, data: { id: 2 } },
				{ id: 3, data: { id: 3 } },
				{ id: 4, data: { id: 4 } },
				{ id: 5, data: { id: 5 } }
			]
		});

		subscription.unsubscribe();
	},
	'ascending'() {
		const dataProvider = new ArrayDataProvider({
			data: [
				{ id: 1 },
				{ id: 1 },
				{ id: 3 },
				{ id: 5 },
				{ id: 2 },
				{ id: 4 }
			]
		});
		let data: DataProperties<any> = { items: [] };
		const subscription = dataProvider.observe().subscribe((updated) => {
			data = updated;
		});
		dataProvider.sort({ columnId: 'id', descending: false });

		assert.deepEqual(data, {
			sort: [ { columnId: 'id', descending: false } ],
			items: [
				{ id: 1, data: { id: 1 } },
				{ id: 1, data: { id: 1 } },
				{ id: 2, data: { id: 2 } },
				{ id: 3, data: { id: 3 } },
				{ id: 4, data: { id: 4 } },
				{ id: 5, data: { id: 5 } }
			]
		});

		subscription.unsubscribe();
	},
	'descending'() {
		const dataProvider = new ArrayDataProvider({
			data: [
				{ id: 1 },
				{ id: 1 },
				{ id: 3 },
				{ id: 5 },
				{ id: 2 },
				{ id: 4 }
			]
		});
		let data: DataProperties<any> = { items: [] };
		const subscription = dataProvider.observe().subscribe((updated) => {
			data = updated;
		});
		dataProvider.sort({ columnId: 'id', descending: true });

		assert.deepEqual(data, {
			sort: [ { columnId: 'id', descending: true } ],
			items: [
				{ id: 5, data: { id: 5 } },
				{ id: 4, data: { id: 4 } },
				{ id: 3, data: { id: 3 } },
				{ id: 2, data: { id: 2 } },
				{ id: 1, data: { id: 1 } },
				{ id: 1, data: { id: 1 } }
			]
		});

		subscription.unsubscribe();
	},
	'configure'() {
		const dataProvider = new ArrayDataProvider({
			data: [
				{ id: 1 },
				{ id: 1 },
				{ id: 3 },
				{ id: 5 },
				{ id: 2 },
				{ id: 4 }
			]
		});
		let data: DataProperties<any> = { items: [] };
		const subscription = dataProvider.observe().subscribe((updated) => {
			data = updated;
		});
		dataProvider.configure({ sort: { columnId: 'id', descending: false } });

		assert.deepEqual(data, {
			sort: [ { columnId: 'id', descending: false } ],
			items: [
				{ id: 1, data: { id: 1 } },
				{ id: 1, data: { id: 1 } },
				{ id: 2, data: { id: 2 } },
				{ id: 3, data: { id: 3 } },
				{ id: 4, data: { id: 4 } },
				{ id: 5, data: { id: 5 } }
			]
		});

		subscription.unsubscribe();
	}
});
