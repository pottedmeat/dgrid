import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';
import { VNode } from '@dojo/interfaces/vdom';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import { spy, stub, SinonSpy, SinonStub } from 'sinon';
import * as compose from '@dojo/compose/compose';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import createRow from '../../src/createRow';

let widgetBaseSpy: SinonSpy;
let getStub: SinonStub;
let isComposeFactoryStub: SinonStub;
let mockRegistry: FactoryRegistry;

registerSuite({
	name: 'createRow',
	beforeEach() {
		widgetBaseSpy = spy(createWidgetBase);
		getStub = stub().withArgs('row-view').returns(widgetBaseSpy);
		isComposeFactoryStub = stub(compose, 'isComposeFactory').returns(true);
		mockRegistry = <any> {
			get: getStub,
			has() {
				return true;
			}
		};
	},
	afterEach() {
		isComposeFactoryStub.restore();
	},
	render() {
		const properties = {
			registry: mockRegistry,
			columns: [
				{ id: 'foo', label: 'foo' }
			],
			item: {
				data: { foo: 'bar' }
			}
		};

		const row = createRow({ properties });
		const vnode = <VNode> row.__render__();

		assert.strictEqual(vnode.vnodeSelector, 'div.dgrid-row');
		assert.strictEqual(vnode.properties!['role'], 'row');
		assert.strictEqual(vnode.properties!.bind, row);
		assert.lengthOf(vnode.children, 1);

		const table = vnode.children![0];
		assert.strictEqual(table.vnodeSelector, 'table.dgrid-row-table');
		assert.strictEqual(table.properties!['role'], 'presentation');
		assert.lengthOf(table.children, 1);

		assert.isTrue(widgetBaseSpy.calledOnce);
		assert.isTrue(widgetBaseSpy.calledWith({
			properties: {
				registry: mockRegistry,
				data: properties.item.data.foo,
				item: properties.item,
				key: properties.columns[0].id,
				renderer: undefined,
				bind: row
			}
		}));
	},
	'render with no columns'() {
		const properties: any = {
			registry: mockRegistry,
			item: { foo: 'bar' }
		};
		const rowView = createRow({ properties });

		const vnode = <VNode> rowView.__render__();
		assert.strictEqual(vnode.vnodeSelector, 'div.dgrid-row');
		assert.lengthOf(vnode.children, 1);

		const table = vnode.children![0];
		assert.lengthOf(table.children, 1);

		const tr = table.children![0];
		assert.lengthOf(tr.children, 0);
		assert.isTrue(widgetBaseSpy.notCalled);
	}
});
